import { ColumnMapping, RawParseResult, Transaction, TransactionType } from '../types';
import { inferTransactionType, normalizeMerchant, suggestCategory } from './categorizer';

/**
 * Standard RFC 4180 CSV parser that properly handles:
 * - Quoted fields with commas e.g. "College Canteen, Block A"
 * - Escaped quotes ("" -> ")
 * - CRLF and LF newlines
 * - Blank trailing rows
 */
export function parseCSVToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

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
 * Parses a date string into standard ISO YYYY-MM-DD.
 * Supports:
 * - YYYY-MM-DD
 * - DD/MM/YYYY or DD-MM-YYYY
 * - MM/DD/YYYY
 * - DD Mon YYYY (e.g. 15 Oct 2026)
 */
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // 1. Direct ISO match: 2026-10-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Try standard Date.parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Parses numeric currency strings, stripping ₹, $, commas, and accounting signs.
 */
export function normalizeAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') {
    return Math.abs(amountStr);
  }
  if (!amountStr) return 0;

  // Clean out currency symbols and whitespace
  let clean = amountStr.replace(/[₹$€£,\s]/g, '');

  // Handle accounting format: (120.50) -> 120.50
  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = clean.slice(1, -1);
  }

  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.abs(val);
}

/**
 * Auto-detects columns from CSV headers.
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const mapping: ColumnMapping = {
    date: '',
    description: '',
    amount: '',
  };

  // Find Date
  const dateIdx = lowerHeaders.findIndex(
    (h) => h.includes('date') || h.includes('txn_dt') || h.includes('time') || h === 'dt'
  );
  if (dateIdx !== -1) mapping.date = headers[dateIdx];

  // Find Description / Narration / Merchant
  const descIdx = lowerHeaders.findIndex(
    (h) =>
      h.includes('desc') ||
      h.includes('narrat') ||
      h.includes('particular') ||
      h.includes('merchant') ||
      h.includes('remark') ||
      h.includes('detail') ||
      h.includes('payee')
  );
  if (descIdx !== -1) mapping.description = headers[descIdx];

  // Find Amount / Debit / Withdrawal
  const amountIdx = lowerHeaders.findIndex(
    (h) =>
      h.includes('amount') ||
      h.includes('debit') ||
      h.includes('withdrawal') ||
      h.includes('spent') ||
      h.includes('inr') ||
      h === 'dr'
  );
  if (amountIdx !== -1) mapping.amount = headers[amountIdx];

  // Find Type
  const typeIdx = lowerHeaders.findIndex(
    (h) =>
      h.includes('type') ||
      h.includes('dr/cr') ||
      h.includes('cr_dr') ||
      h === 'mode' ||
      h === 'd/c'
  );
  if (typeIdx !== -1) mapping.type = headers[typeIdx];

  // Find Category
  const catIdx = lowerHeaders.findIndex(
    (h) => h.includes('category') || h.includes('tag') || h.includes('label')
  );
  if (catIdx !== -1) mapping.category = headers[catIdx];

  // Fallbacks if not detected by keywords
  if (!mapping.date && headers.length > 0) mapping.date = headers[0];
  if (!mapping.description && headers.length > 1) mapping.description = headers[1];
  if (!mapping.amount && headers.length > 2) mapping.amount = headers[2];

  return mapping;
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
      detectedMapping: { date: '', description: '', amount: '' },
      validationErrors: ['The uploaded file is empty.'],
      totalRows: 0,
      duplicateRows: 0,
    };
  }

  const rawHeaders = table[0];
  const dataRows = table.slice(1);

  if (rawHeaders.length < 2) {
    validationErrors.push('CSV appears to have fewer than 2 columns. Check file formatting.');
  }

  const mapping = autoDetectColumns(rawHeaders);

  // Convert to object records
  const rows: Record<string, string>[] = [];
  const seenSignatures = new Set<string>();
  let duplicateCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const rowValues = dataRows[i];
    const record: Record<string, string> = {};

    rawHeaders.forEach((h, colIndex) => {
      record[h] = rowValues[colIndex] ?? '';
    });

    // Check duplicate
    const signature = JSON.stringify(record);
    if (seenSignatures.has(signature)) {
      duplicateCount++;
    } else {
      seenSignatures.add(signature);
    }

    rows.push(record);
  }

  return {
    headers: rawHeaders,
    rows,
    detectedMapping: mapping,
    validationErrors,
    totalRows: rows.length,
    duplicateRows: duplicateCount,
  };
}

/**
 * Converts validated mapped records into strongly-typed Transaction items.
 */
export function buildTransactionsFromMapping(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  options: {
    deduplicate?: boolean;
    autoCategorize?: boolean;
    defaultExcludeTransfers?: boolean;
  } = {}
): { transactions: Transaction[]; invalidCount: number } {
  const { deduplicate = true, autoCategorize = true, defaultExcludeTransfers = true } = options;
  const transactions: Transaction[] = [];
  const seenSignatures = new Set<string>();
  let invalidCount = 0;

  rows.forEach((row, index) => {
    const rawDate = row[mapping.date] || '';
    const rawDesc = row[mapping.description] || '';
    const rawAmt = row[mapping.amount] || '';
    const rawType = mapping.type ? row[mapping.type] || '' : '';
    const rawCat = mapping.category ? row[mapping.category] || '' : '';

    const normalizedDate = normalizeDate(rawDate);
    const amount = normalizeAmount(rawAmt);

    // If both date and amount are completely invalid, count as invalid row
    if (!normalizedDate && amount === 0) {
      invalidCount++;
      return;
    }

    const type: TransactionType = inferTransactionType(rawType, amount, rawDesc);
    const merchant = normalizeMerchant(rawDesc);
    const category =
      rawCat.trim() && rawCat.trim().toLowerCase() !== 'other'
        ? rawCat.trim()
        : autoCategorize
        ? suggestCategory(rawDesc, type)
        : 'Other & Miscellaneous';

    // Deduplication check based on key attributes
    const dedupeKey = `${normalizedDate || 'nodate'}_${merchant}_${amount}_${type}`;
    if (deduplicate && seenSignatures.has(dedupeKey)) {
      return;
    }
    seenSignatures.add(dedupeKey);

    const isTransfer = type === 'transfer' || category.toLowerCase().includes('transfer');

    transactions.push({
      id: `tx_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
      date: normalizedDate || new Date().toISOString().split('T')[0],
      description: rawDesc || 'Transaction',
      merchant,
      amount,
      type,
      category,
      excluded: defaultExcludeTransfers && isTransfer,
      raw: row,
    });
  });

  // Sort chronologically
  transactions.sort((a, b) => a.date.localeCompare(b.date));

  return { transactions, invalidCount };
}

/**
 * Generates sample CSV string for users to download and inspect.
 */
export function generateSampleCSVString(): string {
  const lines = [
    'Date,Description,Amount,Type,Category',
    '2026-10-01,Allowance from Parents,6500,Income,Income & Allowance',
    '2026-10-02,College Canteen Lunch,95,Expense,Food & Dining',
    '2026-10-03,Namma Metro Smart Card Recharge,200,Expense,Transport & Commute',
    '2026-10-04,Xerox Lab Manual & Notes,60,Expense,Education & Academics',
    '2026-10-05,Chai Point & Evening Snacks,45,Expense,Food & Dining',
    '2026-10-06,Blinkit Instant Groceries & Milk,280,Expense,Groceries & Quick Commerce',
    '2026-10-08,College Canteen Breakfast,50,Expense,Food & Dining',
    '2026-10-09,Jio 5G Monthly Recharge,299,Expense,Bills & Utilities',
    '2026-10-10,Swiggy Weekend Biryani Feast,380,Expense,Food & Dining',
    '2026-10-11,Rapido Auto to College,75,Expense,Transport & Commute',
    '2026-10-13,Engineering Textbook Sapna Book House,420,Expense,Education & Academics',
    '2026-10-14,College Canteen Tea & Samosa,35,Expense,Food & Dining',
    '2026-10-16,Spotify Student Premium,59,Expense,Entertainment & OTT',
    '2026-10-18,PVR Cinema Movie Ticket with Friends,260,Expense,Entertainment & OTT',
    '2026-10-19,Zepto Midnight Snacks,190,Expense,Groceries & Quick Commerce',
    '2026-10-21,Decathlon Sports Gym Band,299,Expense,Shopping & Lifestyle',
    '2026-10-23,College Canteen Lunch,80,Expense,Food & Dining',
    '2026-10-24,Namma Metro Ride,45,Expense,Transport & Commute',
    '2026-10-25,Apollo Pharmacy Paracetamol & ORS,110,Expense,Health & Personal Care',
    '2026-10-28,College Canteen Snacks,60,Expense,Food & Dining',
    '2026-10-29,Zomato Late Night Burger,210,Expense,Food & Dining',
    '2026-10-31,Diwali T-shirt Zudio Mall,699,Expense,Shopping & Lifestyle',
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
  link.setAttribute('download', 'fincosmos_sample_transactions.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
