import { ColumnMapping, RawParseResult, StatementColumnMode, Transaction, TransactionType } from '../types';
import { inferTransactionType, normalizeMerchant, suggestCategory } from './categorizer';

/**
 * Standard RFC 4180 CSV parser that properly handles:
 * - BOM removal
 * - Quoted fields with embedded commas and newlines
 * - Escaped quotes ("" -> ")
 * - CRLF and LF newlines
 * - Blank trailing rows
 */
export function parseCSVToRows(csvText: string): string[][] {
  if (!csvText) return [];
  // Strip UTF-8 BOM if present
  const cleanText = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push remainder
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Month names map for Indian bank statements (e.g. 15-OCT-2026, 05 Nov 2026).
 */
const MONTH_NAMES: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/**
 * Parses Indian bank statement dates strictly into ISO YYYY-MM-DD.
 * NEVER returns today's date if unparseable; returns null.
 *
 * Supports:
 * - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 * - DD/MM/YY, DD-MM-YY (converts 2-digit year to 20YY)
 * - DD MMM YYYY, DD-MMM-YYYY, DD MMM YY (e.g. 15 Oct 2026, 05-Nov-26)
 * - YYYY-MM-DD (ISO)
 */
export function normalizeDate(dateStr: string, fallbackYear?: number): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (trimmed.length < 5) return null;

  // 1. Direct ISO: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1990 && y <= 2100) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 3. DD/MM/YY or DD-MM-YY (2-digit year common in Indian passbooks)
  const dmyShortMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/);
  if (dmyShortMatch) {
    const d = parseInt(dmyShortMatch[1], 10);
    const m = parseInt(dmyShortMatch[2], 10);
    const shortY = parseInt(dmyShortMatch[3], 10);
    const fullY = shortY < 70 ? 2000 + shortY : 1900 + shortY;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${fullY}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 4. DD-MMM-YYYY or DD MMM YYYY or DD-MMM-YY (e.g. 15-OCT-2026, 05 Nov 26)
  const textMonthMatch = trimmed.match(/^(\d{1,2})[\s\-/]([A-Za-z]{3,9})[\s\-/](\d{2,4})$/);
  if (textMonthMatch) {
    const d = parseInt(textMonthMatch[1], 10);
    const monthStr = textMonthMatch[2].toLowerCase();
    const monthNum = MONTH_NAMES[monthStr];
    let year = parseInt(textMonthMatch[3], 10);
    if (year < 100) {
      year = year < 70 ? 2000 + year : 1900 + year;
    }
    if (monthNum && d >= 1 && d <= 31 && year >= 1990 && year <= 2100) {
      return `${year}-${monthNum}-${String(d).padStart(2, '0')}`;
    }
  }

  // 5. MMM DD, YYYY
  const usFormatMatch = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (usFormatMatch) {
    const monthStr = usFormatMatch[1].toLowerCase();
    const monthNum = MONTH_NAMES[monthStr];
    const d = parseInt(usFormatMatch[2], 10);
    const year = parseInt(usFormatMatch[3], 10);
    if (monthNum && d >= 1 && d <= 31) {
      return `${year}-${monthNum}-${String(d).padStart(2, '0')}`;
    }
  }

  // 6. MMM DD (e.g. Aug 01, Aug 27) without year (Standard Chartered, international statements)
  const mmmDdMatch = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2})$/);
  if (mmmDdMatch) {
    const monthStr = mmmDdMatch[1].toLowerCase();
    const monthNum = MONTH_NAMES[monthStr];
    const d = parseInt(mmmDdMatch[2], 10);
    const year = fallbackYear || new Date().getFullYear();
    if (monthNum && d >= 1 && d <= 31) {
      return `${year}-${monthNum}-${String(d).padStart(2, '0')}`;
    }
  }

  // 7. DD MMM (e.g. 01 Aug, 27 Aug) without year
  const ddMmmMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
  if (ddMmmMatch) {
    const monthStr = ddMmmMatch[2].toLowerCase();
    const monthNum = MONTH_NAMES[monthStr];
    const d = parseInt(ddMmmMatch[1], 10);
    const year = fallbackYear || new Date().getFullYear();
    if (monthNum && d >= 1 && d <= 31) {
      return `${year}-${monthNum}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Cleans Indian numeric currency strings into positive float.
 * Handles ₹, Rs, INR, commas, (1,500.00), Dr/Cr suffix.
 */
export function normalizeAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') {
    return Math.abs(amountStr);
  }
  if (!amountStr) return 0;

  // Clean out currency symbols, commas, DR/CR suffixes, and whitespace
  let clean = amountStr
    .toString()
    .replace(/[₹$€£,]/g, '')
    .replace(/(?:inr|rs\.?|dr\.?|cr\.?)/gi, '')
    .trim();

  // Accounting format: (120.50) -> 120.50
  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = clean.slice(1, -1);
  }

  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.abs(val);
}

/**
 * Parses signed amounts (+ or -).
 */
export function parseSignedAmount(amountStr: string | number): { amount: number; isNegative: boolean } {
  if (typeof amountStr === 'number') {
    return { amount: Math.abs(amountStr), isNegative: amountStr < 0 };
  }
  if (!amountStr) return { amount: 0, isNegative: false };

  const raw = amountStr.toString().trim();
  const isAccountingNegative = raw.startsWith('(') && raw.endsWith(')');
  const hasMinus = raw.includes('-');
  const hasDr = /(?:\bdr\.?|\bdebit\b)/i.test(raw);

  const clean = raw
    .replace(/[₹$€£,]/g, '')
    .replace(/(?:inr|rs\.?|dr\.?|cr\.?)/gi, '')
    .replace(/[()]/g, '')
    .trim();

  const val = parseFloat(clean);
  if (isNaN(val)) return { amount: 0, isNegative: false };

  const isNeg = hasMinus || isAccountingNegative || hasDr;
  return { amount: Math.abs(val), isNegative: isNeg };
}

/**
 * Identifies if a row is an opening/closing balance or non-transaction metadata line.
 */
export function isSummaryOrMetaRow(rowValues: string[]): boolean {
  const combined = rowValues.join(' ').toLowerCase();

  // Common Indian bank summary rows
  const summaryTokens = [
    'opening balance',
    'closing balance',
    'balance b/f',
    'brought forward',
    'carried forward',
    'b/f balance',
    'c/f balance',
    'total debits',
    'total credits',
    'statement summary',
    'count of transactions',
    'end of statement',
    'generated on',
    'computer generated statement',
    'account balance as on',
    'transaction total',
  ];

  return summaryTokens.some((token) => combined.includes(token));
}

/**
 * Detects where the true transaction table header row starts, skipping
 * multi-line bank account headers (e.g. Account Name, IFSC, Branch, Address).
 */
export function findTableHeaderRow(table: string[][]): {
  headerRowIndex: number;
  headers: string[];
  bankHint?: string;
} {
  let bankHint: string | undefined;

  // Scan metadata in the first 20 rows to detect bank name
  const metaSample = table.slice(0, 15).map((r) => r.join(' ')).join(' ').toLowerCase();
  if (metaSample.includes('hdfc')) bankHint = 'HDFC Bank';
  else if (metaSample.includes('state bank of india') || metaSample.includes('sbi')) bankHint = 'State Bank of India';
  else if (metaSample.includes('icici')) bankHint = 'ICICI Bank';
  else if (metaSample.includes('axis')) bankHint = 'Axis Bank';
  else if (metaSample.includes('kotak')) bankHint = 'Kotak Mahindra Bank';
  else if (metaSample.includes('canara')) bankHint = 'Canara Bank';
  else if (metaSample.includes('bank of baroda') || metaSample.includes('bob')) bankHint = 'Bank of Baroda';
  else if (metaSample.includes('punjab national') || metaSample.includes('pnb')) bankHint = 'Punjab National Bank';

  for (let i = 0; i < Math.min(table.length, 25); i++) {
    const row = table[i];
    if (row.length < 2) continue;

    const lower = row.map((cell) => cell.toLowerCase().trim());

    // Criteria: Has a date-like column, a description-like column, and an amount/debit-like column
    const hasDateCol = lower.some(
      (c) =>
        c === 'date' ||
        c === 'txn date' ||
        c === 'transaction date' ||
        c === 'tran date' ||
        c.includes('post date') ||
        c.includes('value date')
    );

    const hasDescCol = lower.some(
      (c) =>
        c.includes('desc') ||
        c.includes('narrat') ||
        c.includes('particular') ||
        c.includes('remark') ||
        c.includes('detail') ||
        c.includes('merchant') ||
        c.includes('payee')
    );

    const hasMoneyCol = lower.some(
      (c) =>
        c.includes('amount') ||
        c.includes('debit') ||
        c.includes('withdrawal') ||
        c.includes('credit') ||
        c.includes('deposit') ||
        c === 'dr' ||
        c === 'cr'
    );

    if (hasDateCol && (hasDescCol || hasMoneyCol)) {
      // Ensure column headers are non-empty and trimmed
      const cleanHeaders = row.map((h, idx) => h.trim() || `Column_${idx + 1}`);
      return {
        headerRowIndex: i,
        headers: cleanHeaders,
        bankHint,
      };
    }
  }

  // Fallback to row 0 if no clear header found
  const fallbackHeaders = (table[0] || []).map((h, idx) => h.trim() || `Column_${idx + 1}`);
  return {
    headerRowIndex: 0,
    headers: fallbackHeaders,
    bankHint,
  };
}

/**
 * Auto-detects columns from bank statement CSV headers.
 * Determines if statement has:
 * 1. Separate Debit & Credit columns
 * 2. Single Amount + Type column
 * 3. Single Signed Amount column
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  let dateCol = '';
  let valueDateCol = '';
  let descCol = '';
  let debitCol = '';
  let creditCol = '';
  let amountCol = '';
  let typeCol = '';
  let balanceCol = '';
  let refNoCol = '';
  let categoryCol = '';

  lowerHeaders.forEach((h, idx) => {
    const raw = headers[idx];

    // Value date vs Transaction Date
    if (h.includes('value') && h.includes('date')) {
      valueDateCol = raw;
    } else if (
      (h.includes('date') || h.includes('txn_dt') || h === 'dt') &&
      !dateCol
    ) {
      dateCol = raw;
    }

    // Description / Narration / Particulars
    if (
      (h.includes('narrat') ||
        h.includes('particular') ||
        h.includes('desc') ||
        h.includes('detail') ||
        h.includes('remark') ||
        h.includes('merchant') ||
        h.includes('payee')) &&
      !descCol
    ) {
      descCol = raw;
    }

    // Reference / Cheque No / UTR
    if (
      (h.includes('ref') ||
        h.includes('chq') ||
        h.includes('cheque') ||
        h.includes('utr') ||
        h.includes('trans id')) &&
      !refNoCol
    ) {
      refNoCol = raw;
    }

    // Debit / Withdrawal
    if (
      (h.includes('debit') ||
        h.includes('withdrawal') ||
        h === 'dr' ||
        h === 'dr amount' ||
        h === 'dr amt' ||
        h === 'debit amount') &&
      !debitCol
    ) {
      debitCol = raw;
    }

    // Credit / Deposit
    if (
      (h.includes('credit') ||
        h.includes('deposit') ||
        h === 'cr' ||
        h === 'cr amount' ||
        h === 'cr amt' ||
        h === 'credit amount') &&
      !creditCol
    ) {
      creditCol = raw;
    }

    // Amount
    if (
      (h.includes('amount') || h.includes('inr') || h === 'spent') &&
      !h.includes('debit') &&
      !h.includes('credit') &&
      !h.includes('dr') &&
      !h.includes('cr') &&
      !amountCol
    ) {
      amountCol = raw;
    }

    // Type / Dr/Cr flag
    if (
      (h.includes('type') ||
        h.includes('dr/cr') ||
        h.includes('cr/dr') ||
        h.includes('cr_dr') ||
        h === 'mode' ||
        h === 'd/c' ||
        h === 'indicator') &&
      !typeCol
    ) {
      typeCol = raw;
    }

    // Balance
    if (
      (h.includes('balance') || h.includes('closing bal') || h.includes('run bal')) &&
      !balanceCol
    ) {
      balanceCol = raw;
    }

    // Category
    if ((h.includes('category') || h.includes('tag') || h.includes('label')) && !categoryCol) {
      categoryCol = raw;
    }
  });

  // If date wasn't found, try first column
  if (!dateCol && headers.length > 0) dateCol = headers[0];
  if (!descCol && headers.length > 1) descCol = headers[1];

  // Determine mode
  let columnMode: StatementColumnMode = 'separate_debit_credit';
  if (debitCol && creditCol) {
    columnMode = 'separate_debit_credit';
  } else if (amountCol && typeCol) {
    columnMode = 'single_amount_type';
  } else if (amountCol) {
    columnMode = 'signed_amount';
  } else if (debitCol) {
    columnMode = 'separate_debit_credit';
  } else {
    // Fallback: pick column 2 as amount
    amountCol = headers[2] || '';
    columnMode = 'signed_amount';
  }

  return {
    date: dateCol,
    valueDate: valueDateCol || undefined,
    description: descCol,
    refNo: refNoCol || undefined,
    debit: debitCol || undefined,
    credit: creditCol || undefined,
    amount: amountCol || undefined,
    type: typeCol || undefined,
    balance: balanceCol || undefined,
    category: categoryCol || undefined,
    columnMode,
  };
}

/**
 * Parses raw CSV into RawParseResult with preview rows and validation.
 */
export function parseRawCSV(csvText: string): RawParseResult {
  const table = parseCSVToRows(csvText);
  const validationErrors: string[] = [];

  if (table.length === 0) {
    return {
      headers: [],
      rows: [],
      detectedMapping: {
        date: '',
        description: '',
        columnMode: 'separate_debit_credit',
      },
      validationErrors: ['The uploaded file is empty.'],
      totalRows: 0,
      duplicateRows: 0,
      headerLineIndex: 0,
      ignoredSummaryRows: 0,
    };
  }

  // Find true table header
  const { headerRowIndex, headers, bankHint } = findTableHeaderRow(table);
  const dataRows = table.slice(headerRowIndex + 1);

  if (headers.length < 2) {
    validationErrors.push('CSV appears to have fewer than 2 columns. Check file formatting.');
  }

  const mapping = autoDetectColumns(headers);

  // Convert to object records, filtering out summary rows and handling multiline narration
  const rows: Record<string, string>[] = [];
  const seenSignatures = new Set<string>();
  let duplicateCount = 0;
  let ignoredSummaryCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const rowValues = dataRows[i];

    // Check if entire row is empty
    if (!rowValues.some((cell) => cell.length > 0)) {
      continue;
    }

    // Check if summary row
    if (isSummaryOrMetaRow(rowValues)) {
      ignoredSummaryCount++;
      continue;
    }

    const record: Record<string, string> = {};
    headers.forEach((h, colIndex) => {
      record[h] = rowValues[colIndex] ?? '';
    });

    // Check for multiline continuation:
    // If date cell is empty, and all amount/debit/credit cells are zero/empty, but some text exists,
    // append to previous row's description!
    const rowDate = record[mapping.date] || '';
    const rowDebitAmt = mapping.debit ? normalizeAmount(record[mapping.debit]) : 0;
    const rowCreditAmt = mapping.credit ? normalizeAmount(record[mapping.credit]) : 0;
    const rowAmtVal = mapping.amount ? normalizeAmount(record[mapping.amount]) : 0;
    let rowDesc = record[mapping.description] || '';

    if (!rowDesc) {
      const otherTexts = Object.values(record).filter(
        (v) => v && v.length > 1 && isNaN(parseFloat(v.replace(/[₹$,]/g, '')))
      );
      if (otherTexts.length > 0) {
        rowDesc = otherTexts.join(' ').trim();
      }
    }

    if (
      !normalizeDate(rowDate) &&
      rowDebitAmt === 0 &&
      rowCreditAmt === 0 &&
      rowAmtVal === 0 &&
      rowDesc &&
      rows.length > 0
    ) {
      const prev = rows[rows.length - 1];
      prev[mapping.description] = `${prev[mapping.description]} ${rowDesc}`.trim();
      continue;
    }

    // Deduplication check
    const signature = JSON.stringify(record);
    if (seenSignatures.has(signature)) {
      duplicateCount++;
    } else {
      seenSignatures.add(signature);
    }

    rows.push(record);
  }

  return {
    headers,
    rows,
    detectedMapping: mapping,
    validationErrors,
    totalRows: rows.length,
    duplicateRows: duplicateCount,
    headerLineIndex: headerRowIndex,
    ignoredSummaryRows: ignoredSummaryCount,
    bankHint,
  };
}

/**
 * Converts validated mapped records into strongly-typed Transaction items.
 * Performs date normalization, running balance verification, and category tagging.
 */
export function buildTransactionsFromMapping(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  options: {
    deduplicate?: boolean;
    autoCategorize?: boolean;
    defaultExcludeTransfers?: boolean;
  } = {}
): {
  transactions: Transaction[];
  invalidCount: number;
  balanceDiscrepancyCount: number;
} {
  const { deduplicate = true, autoCategorize = true, defaultExcludeTransfers = true } = options;
  const transactions: Transaction[] = [];
  const seenSignatures = new Set<string>();
  let invalidCount = 0;
  let balanceDiscrepancyCount = 0;

  rows.forEach((row, index) => {
    const rawDate = row[mapping.date] || '';
    const rawValueDate = mapping.valueDate ? row[mapping.valueDate] || '' : '';
    const rawDesc = row[mapping.description] || '';
    const rawRef = mapping.refNo ? row[mapping.refNo] || '' : '';
    const rawBal = mapping.balance ? row[mapping.balance] || '' : '';
    const rawCat = mapping.category ? row[mapping.category] || '' : '';

    const normalizedDate = normalizeDate(rawDate);
    const normalizedValueDate = normalizeDate(rawValueDate);
    const balance = rawBal ? normalizeAmount(rawBal) : undefined;

    let amount = 0;
    let debit: number | undefined;
    let credit: number | undefined;
    let type: TransactionType = 'expense';
    const validationIssues: string[] = [];

    // Parse amounts based on detected mode
    if (mapping.columnMode === 'separate_debit_credit' && (mapping.debit || mapping.credit)) {
      const debitRaw = mapping.debit ? row[mapping.debit] || '' : '';
      const creditRaw = mapping.credit ? row[mapping.credit] || '' : '';

      debit = debitRaw ? normalizeAmount(debitRaw) : 0;
      credit = creditRaw ? normalizeAmount(creditRaw) : 0;

      if (debit > 0 && credit === 0) {
        amount = debit;
        type = 'expense';
      } else if (credit > 0 && debit === 0) {
        amount = credit;
        type = 'income';
      } else if (debit > 0 && credit > 0) {
        // Both populated - pick larger or default
        amount = debit;
        type = 'expense';
      } else {
        // Both 0 or blank
        amount = 0;
      }
    } else if (mapping.columnMode === 'single_amount_type') {
      const rawAmt = mapping.amount ? row[mapping.amount] || '' : '';
      const rawType = mapping.type ? row[mapping.type] || '' : '';
      amount = normalizeAmount(rawAmt);
      type = inferTransactionType(rawType, amount, rawDesc);
      if (type === 'income') credit = amount;
      else debit = amount;
    } else {
      // Signed amount
      const rawAmt = mapping.amount ? row[mapping.amount] || '' : '';
      const { amount: parsedAmt, isNegative } = parseSignedAmount(rawAmt);
      amount = parsedAmt;
      type = isNegative ? 'expense' : 'income';
      if (type === 'income') credit = amount;
      else debit = amount;
    }

    // Check invalid date
    if (!normalizedDate) {
      validationIssues.push('INVALID_DATE');
    }

    // Check invalid amount
    if (amount <= 0) {
      validationIssues.push('ZERO_AMOUNT');
    }

    // If both date is missing and amount is zero, drop row completely
    if (!normalizedDate && amount <= 0) {
      invalidCount++;
      return;
    }

    // Merchant extraction
    const merchant = normalizeMerchant(rawDesc);

    // Category assignment
    let category = 'Other & Miscellaneous';
    if (rawCat.trim() && rawCat.trim().toLowerCase() !== 'other') {
      category = rawCat.trim();
    } else if (autoCategorize) {
      category = suggestCategory(rawDesc, type);
    }

    // Needs review flag
    let needsReview = false;
    if (validationIssues.length > 0) {
      needsReview = true;
    }
    if (category === 'Other & Miscellaneous' && amount > 500) {
      needsReview = true;
      validationIssues.push('UNLABELED_MAJOR_EXPENSE');
    }

    // Deduplication check
    const dedupeKey = `${normalizedDate || 'nodate'}_${merchant}_${amount}_${type}_${rawRef}`;
    if (deduplicate && seenSignatures.has(dedupeKey)) {
      return;
    }
    seenSignatures.add(dedupeKey);

    const isTransfer = type === 'transfer' || category.toLowerCase().includes('transfer');

    transactions.push({
      id: `tx_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
      date: normalizedDate || '', // Keep exact or empty; NEVER silent fake date
      valueDate: normalizedValueDate || undefined,
      description: rawDesc || 'Transaction',
      merchant,
      amount,
      debit,
      credit,
      balance,
      refNo: rawRef || undefined,
      type,
      category,
      excluded: defaultExcludeTransfers && isTransfer,
      needsReview,
      validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
      raw: row,
    });
  });

  // Running balance validation across chronological sequence
  if (mapping.balance && transactions.length > 1) {
    for (let i = 1; i < transactions.length; i++) {
      const prev = transactions[i - 1];
      const curr = transactions[i];

      if (prev.balance !== undefined && curr.balance !== undefined && curr.amount > 0) {
        const delta = Math.round((curr.balance - prev.balance) * 100) / 100;
        const expectedDelta = curr.type === 'income' ? curr.amount : -curr.amount;

        // Allow 1 rupee rounding tolerance
        if (Math.abs(Math.abs(delta) - curr.amount) > 1.5) {
          balanceDiscrepancyCount++;
          if (!curr.validationIssues) curr.validationIssues = [];
          curr.validationIssues.push('BALANCE_DISCREPANCY');
          curr.needsReview = true;
        }
      }
    }
  }

  // Sort chronologically (valid dates first)
  transactions.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return { transactions, invalidCount, balanceDiscrepancyCount };
}

/**
 * Generates sample CSV string for users to download and inspect.
 */
export function generateSampleCSVString(): string {
  const lines = [
    'Date,Value Date,Description,Ref No,Debit,Credit,Balance',
    '01/10/2026,01/10/2026,UPI/428192837/Allowance from Parents/HDFC,REF891238,,6500.00,12500.00',
    '02/10/2026,02/10/2026,UPI/428192838/College Canteen Masala Dosa,REF891239,95.00,,12405.00',
    '03/10/2026,03/10/2026,Namma Metro Smart Card Recharge,REF891240,200.00,,12205.00',
    '04/10/2026,04/10/2026,Xerox Lab Manual & Notes,REF891241,60.00,,12145.00',
    '05/10/2026,05/10/2026,Chai Point Tea & Evening Samosa,REF891242,45.00,,12100.00',
    '06/10/2026,06/10/2026,Blinkit Instant Groceries & Milk,REF891243,280.00,,11820.00',
    '08/10/2026,08/10/2026,College Canteen Breakfast,REF891244,50.00,,11770.00',
    '09/10/2026,09/10/2026,Jio 5G Monthly Mobile Recharge,REF891245,299.00,,11471.00',
    '10/10/2026,10/10/2026,Swiggy Weekend Biryani Feast,REF891246,380.00,,11091.00',
    '11/10/2026,11/10/2026,Rapido Auto Ride to College,REF891247,75.00,,11016.00',
    '13/10/2026,13/10/2026,Engineering Textbook Sapna Book House,REF891248,420.00,,10596.00',
    '14/10/2026,14/10/2026,College Canteen Tea & Puff,REF891249,35.00,,10561.00',
    '16/10/2026,16/10/2026,Spotify Student Premium Monthly,REF891250,59.00,,10502.00',
    '18/10/2026,18/10/2026,PVR Cinema Movie Ticket with Friends,REF891251,260.00,,10242.00',
    '19/10/2026,19/10/2026,Zepto Midnight Study Snacks,REF891252,190.00,,10052.00',
    '21/10/2026,21/10/2026,Decathlon Sports Gym Band,REF891253,299.00,,9753.00',
    '23/10/2026,23/10/2026,College Canteen Lunch Thali,REF891254,80.00,,9673.00',
    '24/10/2026,24/10/2026,Namma Metro Ride,REF891255,45.00,,9628.00',
    '25/10/2026,25/10/2026,Apollo Pharmacy Medicines & ORS,REF891256,110.00,,9518.00',
    '28/10/2026,28/10/2026,College Canteen Evening Snack,REF891257,60.00,,9458.00',
    '29/10/2026,29/10/2026,Zomato Late Night Burger,REF891258,210.00,,9248.00',
    '31/10/2026,31/10/2026,Zudio Clothing Festive T-Shirt,REF891259,699.00,,8549.00',
  ];
  return lines.join('\n');
}

/**
 * Downloads sample CSV file directly in browser.
 */
export function downloadSampleCSVFile(): void {
  const content = generateSampleCSVString();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'bank_statement_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
