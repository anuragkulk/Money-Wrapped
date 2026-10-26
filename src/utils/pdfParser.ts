import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { Transaction, TransactionType } from '../types';
import { normalizeAmount, normalizeDate, isSummaryOrMetaRow } from './csvParser';
import { inferTransactionType, normalizeMerchant, suggestCategory } from './categorizer';

// Configure worker for browser runtime
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
  } catch {
    // Fallback if cdn config fails
  }
}

export interface PDFExtractedLine {
  pageNumber: number;
  text: string;
  y: number;
  tokens: Array<{
    str: string;
    x: number;
    width: number;
  }>;
}

export interface PDFParseResult {
  success: boolean;
  transactions: Transaction[];
  bankHint?: string;
  pageCount: number;
  totalExtracted: number;
  invalidCount: number;
  balanceDiscrepancyCount: number;
  ignoredSummaryCount: number;
  validationErrors: string[];
  isPasswordProtected?: boolean;
  isScanned?: boolean;
  rawTextPreview?: string;
  error?: string;
}

/**
 * Extracts layout-aware lines from a PDF ArrayBuffer page by page.
 */
export async function extractLinesFromPDF(
  arrayBuffer: ArrayBuffer,
  password?: string
): Promise<{
  lines: PDFExtractedLine[];
  pageCount: number;
  isPasswordProtected?: boolean;
  isScanned?: boolean;
  bankHint?: string;
  error?: string;
}> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      password: password || undefined,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const allLines: PDFExtractedLine[] = [];
    let totalTextItemsCount = 0;
    let fullTextSample = '';

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items as Array<{
        str: string;
        transform: number[];
        width: number;
        height: number;
      }>;

      totalTextItemsCount += items.length;

      // Group items by line based on Y coordinates
      // In PDF, Y goes from bottom (0) to top.
      const lineMap: Array<{
        y: number;
        tokens: Array<{ str: string; x: number; width: number }>;
      }> = [];

      items.forEach((item) => {
        const str = item.str;
        if (!str || str.trim().length === 0) return;

        const x = item.transform[4];
        const y = Math.round(item.transform[5] * 10) / 10;
        const width = item.width;

        // Find existing line within 3.5px vertical proximity
        let line = lineMap.find((l) => Math.abs(l.y - y) <= 3.5);
        if (!line) {
          line = { y, tokens: [] };
          lineMap.push(line);
        }

        line.tokens.push({ str, x, width });
      });

      // Sort lines top to bottom (Y descending)
      lineMap.sort((a, b) => b.y - a.y);

      // Within each line, sort tokens left to right (X ascending)
      lineMap.forEach((line) => {
        line.tokens.sort((a, b) => a.x - b.x);

        // Build text with spacing preservation based on horizontal gaps
        let lineStr = '';
        for (let i = 0; i < line.tokens.length; i++) {
          const curr = line.tokens[i];
          if (i === 0) {
            lineStr += curr.str;
          } else {
            const prev = line.tokens[i - 1];
            const gap = curr.x - (prev.x + prev.width);
            if (gap > 12) {
              lineStr += '   ' + curr.str;
            } else if (gap > 3 || !lineStr.endsWith(' ')) {
              lineStr += ' ' + curr.str;
            } else {
              lineStr += curr.str;
            }
          }
        }

        const trimmed = lineStr.trim();
        if (trimmed.length > 0) {
          allLines.push({
            pageNumber: pageNum,
            text: trimmed,
            y: line.y,
            tokens: line.tokens,
          });
          fullTextSample += ' ' + trimmed;
        }
      });
    }

    // Check for scanned / image-only PDF
    if (totalTextItemsCount < 15 || fullTextSample.trim().length < 50) {
      return {
        lines: [],
        pageCount,
        isScanned: true,
        error:
          'This PDF appears to be a scanned image or photo with no selectable text. Please upload an official digital e-statement PDF exported from net banking or mobile banking.',
      };
    }

    // Detect bank brand (Google Pay & Indian/Global Banks)
    let bankHint: string | undefined;
    const lower = fullTextSample.toLowerCase();
    if (
      lower.includes('google pay') ||
      lower.includes('gpay') ||
      (lower.includes('transaction statement') &&
        lower.includes('upi transaction id') &&
        (lower.includes('received from') || lower.includes('paid to')))
    ) {
      if (lower.includes('standard chartered') || lower.includes('scbl')) {
        bankHint = 'Google Pay (Standard Chartered Bank)';
      } else if (lower.includes('state bank') || lower.includes('sbi')) {
        bankHint = 'Google Pay (State Bank of India)';
      } else if (lower.includes('hdfc')) {
        bankHint = 'Google Pay (HDFC Bank)';
      } else if (lower.includes('icici')) {
        bankHint = 'Google Pay (ICICI Bank)';
      } else if (lower.includes('axis')) {
        bankHint = 'Google Pay (Axis Bank)';
      } else {
        bankHint = 'Google Pay';
      }
    } else if (lower.includes('standard chartered') || lower.includes('scbl') || lower.includes('scb 23 25')) {
      bankHint = 'Standard Chartered Bank';
    } else if (lower.includes('hdfc bank') || lower.includes('hdfc standard') || (lower.includes('hdfc') && !lower.includes('@') && !lower.includes('paytm'))) {
      bankHint = 'HDFC Bank';
    } else if (lower.includes('state bank of india') || lower.includes('sbi ') || lower.includes('sbin0')) {
      bankHint = 'State Bank of India';
    } else if (lower.includes('icici bank') || lower.includes('icic0')) {
      bankHint = 'ICICI Bank';
    } else if (lower.includes('axis bank') || lower.includes('utib0')) {
      bankHint = 'Axis Bank';
    } else if (lower.includes('kotak') || lower.includes('kkbk0')) {
      bankHint = 'Kotak Mahindra Bank';
    } else if (lower.includes('canara') || lower.includes('cnrb0')) {
      bankHint = 'Canara Bank';
    } else if (lower.includes('bank of baroda') || lower.includes('barb0')) {
      bankHint = 'Bank of Baroda';
    } else if (lower.includes('punjab national') || lower.includes('punb0')) {
      bankHint = 'Punjab National Bank';
    } else if (lower.includes('barclays')) {
      bankHint = 'Barclays';
    } else if (lower.includes('hsbc')) {
      bankHint = 'HSBC';
    } else if (lower.includes('citibank') || lower.includes('citi bank')) {
      bankHint = 'Citibank';
    } else if (lower.includes('chase') || lower.includes('jpmorgan')) {
      bankHint = 'Chase';
    } else if (lower.includes('bank of america')) {
      bankHint = 'Bank of America';
    } else if (lower.includes('wells fargo')) {
      bankHint = 'Wells Fargo';
    }

    return {
      lines: allLines,
      pageCount,
      bankHint,
    };
  } catch (err: any) {
    const msg = err?.message || '';
    if (err?.name === 'PasswordException' || msg.includes('password') || msg.includes('Password')) {
      return {
        lines: [],
        pageCount: 0,
        isPasswordProtected: true,
        error:
          'This bank statement is password-protected. Indian bank PDFs are typically protected using your Date of Birth (DDMMYYYY) or PAN / Account Number.',
      };
    }
    return {
      lines: [],
      pageCount: 0,
      error: `Could not parse PDF: ${msg || 'Unknown error'}`,
    };
  }
}

/**
 * Checks if a line is a header row or page footer.
 */
function isTableOrPageArtifact(line: string): boolean {
  const lower = line.toLowerCase().trim();

  // Page numbers & system disclaimers
  if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(lower)) return true;
  if (/^contd\.?\s*\d*$/i.test(lower)) return true;
  if (lower.includes('computer generated') || lower.includes('statement generated on')) return true;
  if (lower.includes('registered office') || lower.includes('corporate office')) return true;
  if (lower.includes('please examine this statement immediately')) return true;

  // Table header repeat detection
  const hasDateHeader = lower.includes('txn date') || lower.includes('transaction date') || lower.includes('tran date') || lower.includes('value date');
  const hasMoneyHeader = lower.includes('debit') || lower.includes('withdrawal') || lower.includes('credit') || lower.includes('deposit') || lower.includes('balance');
  if (hasDateHeader && hasMoneyHeader) return true;

  return false;
}

/**
 * Parses bank statement PDF lines into structured, normalized Transactions.
 */
export async function parsePDFStatement(
  arrayBuffer: ArrayBuffer,
  options: {
    password?: string;
    deduplicate?: boolean;
    autoCategorize?: boolean;
    defaultExcludeTransfers?: boolean;
  } = {}
): Promise<PDFParseResult> {
  const {
    password,
    deduplicate = true,
    autoCategorize = true,
    defaultExcludeTransfers = true,
  } = options;

  const extractResult = await extractLinesFromPDF(arrayBuffer, password);

  if (!extractResult.lines || extractResult.lines.length === 0) {
    return {
      success: false,
      transactions: [],
      pageCount: extractResult.pageCount || 0,
      totalExtracted: 0,
      invalidCount: 0,
      balanceDiscrepancyCount: 0,
      ignoredSummaryCount: 0,
      validationErrors: [extractResult.error || 'No readable text lines found in PDF.'],
      isPasswordProtected: extractResult.isPasswordProtected,
      isScanned: extractResult.isScanned,
      error: extractResult.error,
    };
  }

  const lines = extractResult.lines;

  // Dedicated high-precision parser for Google Pay statements
  const isGooglePay =
    Boolean(extractResult.bankHint?.includes('Google Pay')) ||
    (lines.some((l) => /transaction statement/i.test(l.text)) &&
      lines.some((l) => /upi transaction id/i.test(l.text)) &&
      lines.some((l) => /received from|paid to/i.test(l.text)));

  if (isGooglePay) {
    return parseGooglePayStatement(lines, extractResult, options);
  }

  const transactions: Transaction[] = [];
  const seenSignatures = new Set<string>();
  let ignoredSummaryCount = 0;
  let invalidCount = 0;
  let balanceDiscrepancyCount = 0;
  const validationErrors: string[] = [];

  // 1. Detect statement year from document metadata (e.g. "01 Aug 2026 To 31 Aug 2026")
  let statementYear = new Date().getFullYear();
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const text = lines[i].text;
    const yearMatch =
      text.match(/(?:statement\s+date|period|date)[\s:]*(?:.*?)(\b20\d{2}\b)/i) ||
      text.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      statementYear = parseInt(yearMatch[1], 10);
      break;
    }
  }

  // 2. Dynamic column coordinate detection from table headers (Deposit / Withdrawal / Balance)
  let depX = 400;
  let wdlX = 460;
  let balX = 525;
  for (const lineObj of lines) {
    const lower = lineObj.text.toLowerCase();
    const hasDep = lower.includes('deposit') || lower.includes('credit') || lower.includes('cr');
    const hasWdl = lower.includes('withdrawal') || lower.includes('debit') || lower.includes('dr');
    if (hasDep && hasWdl) {
      const depToken = lineObj.tokens.find((t) => /^(deposit|credit|cr)$/i.test(t.str.trim()));
      const wdlToken = lineObj.tokens.find((t) => /^(withdrawal|debit|dr)$/i.test(t.str.trim()));
      const balToken = lineObj.tokens.find((t) => /^(balance|bal)$/i.test(t.str.trim()));
      if (depToken && wdlToken) {
        depX = depToken.x;
        wdlX = wdlToken.x;
        if (balToken) balX = balToken.x;
        break;
      }
    }
  }

  // Universal date regex matching row dates:
  // e.g. "Aug 01", "01 Aug", "01/08/2026", "01-08-2026", "01 Aug 2026", "2026-08-01"
  const dateRegex =
    /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s\-/][A-Za-z]{3,9}[\s\-/]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\b/gi;

  // Numeric amount regex: matches numbers like 1,500.00 or 250.00 or 1500
  const amountRegex = /\b(?:\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})|\d+\.\d{2})\b/g;

  let currentTx: Transaction | null = null;
  let prevBalance: number | undefined;

  for (let i = 0; i < lines.length; i++) {
    const lineObj = lines[i];
    const text = lineObj.text;

    // Skip summary rows, but capture opening balance if present
    if (isSummaryOrMetaRow([text])) {
      ignoredSummaryCount++;
      const openingAmt = text.match(amountRegex);
      if (openingAmt && prevBalance === undefined) {
        prevBalance = normalizeAmount(openingAmt[openingAmt.length - 1]);
      }
      continue;
    }

    // Skip table header repeats or page footers
    if (isTableOrPageArtifact(text)) {
      continue;
    }

    // Look for dates in the line
    const dateMatches = Array.from(text.matchAll(dateRegex)).map((m) => m[0]);

    if (dateMatches.length > 0) {
      const rawDate1 = dateMatches[0];
      const rawDate2 = dateMatches.length > 1 ? dateMatches[1] : undefined;

      const normDate1 = normalizeDate(rawDate1, statementYear);
      const normDate2 = rawDate2 ? normalizeDate(rawDate2, statementYear) : undefined;

      // Extract numeric amount tokens with coordinates
      const amtTokens = lineObj.tokens.filter((t) =>
        /^\d{1,3}(?:,\d{3})*(?:\.\d{2})$/.test(t.str.trim()) || /^\d+\.\d{2}$/.test(t.str.trim())
      );
      const strAmounts = Array.from(text.matchAll(amountRegex)).map((m) =>
        normalizeAmount(m[0])
      );

      // If line has a valid date and at least one monetary amount:
      if (normDate1 && (amtTokens.length > 0 || strAmounts.length > 0)) {
        let txnDate = normDate1;
        let valueDate = normDate2;

        if (text.toLowerCase().includes('val dt') && normDate2) {
          valueDate = normDate1;
          txnDate = normDate2;
        }

        let debit: number | undefined;
        let credit: number | undefined;
        let balance: number | undefined;
        let amount = 0;
        let type: TransactionType = 'expense';

        if (amtTokens.length >= 2) {
          // Token 0 is amount, last token is balance
          const tAmt = amtTokens[0];
          const tBal = amtTokens[amtTokens.length - 1];
          amount = normalizeAmount(tAmt.str);
          balance = normalizeAmount(tBal.str);

          // Test proximity to Deposit column vs Withdrawal column
          const distDep = Math.abs(tAmt.x - depX);
          const distWdl = Math.abs(tAmt.x - wdlX);
          let isDep = distDep < distWdl;

          // Verify with balance delta if previous balance is known
          if (prevBalance !== undefined && balance !== undefined) {
            const delta = Math.round((balance - prevBalance) * 100) / 100;
            if (delta > 0 && Math.abs(delta - amount) < 2.0) {
              isDep = true;
            } else if (delta < 0 && Math.abs(Math.abs(delta) - amount) < 2.0) {
              isDep = false;
            }
          }

          if (isDep) {
            credit = amount;
            type = 'income';
          } else {
            debit = amount;
            type = 'expense';
          }
        } else if (amtTokens.length === 1) {
          // Single amount token with coordinate
          const token = amtTokens[0];
          const val = normalizeAmount(token.str);

          if (token.x >= balX - 25 && prevBalance !== undefined) {
            balance = val;
            amount = Math.round(Math.abs(balance - prevBalance) * 100) / 100;
            if (balance > prevBalance) {
              type = 'income';
              credit = amount;
            } else {
              type = 'expense';
              debit = amount;
            }
          } else {
            amount = val;
            const isDep = Math.abs(token.x - depX) < Math.abs(token.x - wdlX);
            if (isDep) {
              type = 'income';
              credit = amount;
            } else {
              type = 'expense';
              debit = amount;
            }
          }
        } else {
          // Fallback from string amounts when token splitting is uniform
          amount = strAmounts[0];
          if (strAmounts.length >= 2) {
            balance = strAmounts[strAmounts.length - 1];
          }

          if (prevBalance !== undefined && balance !== undefined) {
            const delta = Math.round((balance - prevBalance) * 100) / 100;
            if (delta > 0) {
              type = 'income';
              credit = amount;
            } else {
              type = 'expense';
              debit = amount;
            }
          } else {
            type = inferTransactionType('', amount, text);
            if (type === 'income') credit = amount;
            else debit = amount;
          }
        }

        if (balance !== undefined && balance > 0) {
          prevBalance = balance;
        }

        // Clean narration: take all tokens that appear before amount columns
        const descTokens = lineObj.tokens.filter(
          (t) => t.x < Math.min(depX, wdlX) - 10
        );
        let rawNarration =
          descTokens.length > 0 ? descTokens.map((t) => t.str).join(' ') : text;

        dateMatches.forEach((d) => {
          rawNarration = rawNarration.replace(d, ' ');
        });
        rawNarration = rawNarration.replace(amountRegex, ' ');
        let narration = rawNarration
          .replace(/\b(dr|cr|inr|rs\.?)\b/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!narration) {
          narration = 'Bank Transaction';
        }

        const refMatch = text.match(
          /\b(UPI\/\d+|NEFT[A-Z0-9]+|IMPS\d+|REF\s*[A-Z0-9]+|CHQ\s*\d+|POS\s*\d+)\b/i
        );
        const refNo = refMatch ? refMatch[0].trim() : undefined;

        const merchant = normalizeMerchant(narration);
        const category = autoCategorize
          ? suggestCategory(narration, type)
          : 'Other & Miscellaneous';

        const validationIssues: string[] = [];
        if (amount <= 0) {
          validationIssues.push('ZERO_AMOUNT');
        }

        const isTransfer = type === 'transfer' || category.toLowerCase().includes('transfer');

        const newTx: Transaction = {
          id: `tx_pdf_${Date.now()}_${transactions.length}_${Math.random().toString(36).substring(2, 6)}`,
          date: txnDate,
          valueDate: valueDate || undefined,
          description: narration,
          merchant,
          amount,
          debit,
          credit,
          balance,
          refNo,
          type,
          category,
          excluded: defaultExcludeTransfers && isTransfer,
          pageNumber: lineObj.pageNumber,
          confidence: 0.98,
          needsReview: validationIssues.length > 0,
          validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
          raw: {
            sourceLine: text,
            page: String(lineObj.pageNumber),
          },
        };

        const dedupeKey = `${txnDate}_${merchant}_${amount}_${type}_${refNo || ''}`;
        if (!deduplicate || !seenSignatures.has(dedupeKey)) {
          seenSignatures.add(dedupeKey);
          transactions.push(newTx);
          currentTx = newTx;
        }
        continue;
      }
    }

    // MULTILINE CONTINUATION CHECK:
    // If line has NO dates and NO amounts, and currentTx exists:
    const lineAmtTokens = lineObj.tokens.filter((t) =>
      /^\d{1,3}(?:,\d{3})*(?:\.\d{2})$/.test(t.str.trim()) || /^\d+\.\d{2}$/.test(t.str.trim())
    );
    const lineStrAmts = Array.from(text.matchAll(amountRegex));

    if (
      dateMatches.length === 0 &&
      lineAmtTokens.length === 0 &&
      lineStrAmts.length === 0 &&
      currentTx &&
      text.length > 1
    ) {
      const lower = text.toLowerCase();
      // Ignore system disclaimers or page markers
      if (
        !lower.includes('statement date') &&
        !lower.includes('account statement') &&
        !lower.includes('branch address') &&
        !lower.includes('cathedral road') &&
        !lower.includes('bank deposits are covered') &&
        !lower.includes('dicgc') &&
        !lower.includes('page ')
      ) {
        let addText = text.trim();
        if (lineObj.tokens.length > 3) {
          const descTokens = lineObj.tokens.filter((t) => t.x < Math.min(depX, wdlX) - 10);
          if (descTokens.length > 0) {
            addText = descTokens.map((t) => t.str).join(' ').trim();
          }
        }
        if (addText.length > 0) {
          currentTx.description = `${currentTx.description} ${addText}`.trim();
          currentTx.merchant = normalizeMerchant(currentTx.description);
          if (autoCategorize) {
            currentTx.category = suggestCategory(currentTx.description, currentTx.type);
          }
        }
      }
    }
  }

  // Running balance reconciliation
  if (transactions.length > 1) {
    for (let i = 1; i < transactions.length; i++) {
      const prev = transactions[i - 1];
      const curr = transactions[i];

      if (prev.balance !== undefined && curr.balance !== undefined && curr.amount > 0) {
        const delta = Math.round((curr.balance - prev.balance) * 100) / 100;
        // Verify balance delta matches debit or credit
        if (Math.abs(Math.abs(delta) - curr.amount) > 2.0) {
          balanceDiscrepancyCount++;
          if (!curr.validationIssues) curr.validationIssues = [];
          if (!curr.validationIssues.includes('BALANCE_DISCREPANCY')) {
            curr.validationIssues.push('BALANCE_DISCREPANCY');
          }
          curr.needsReview = true;
        }
      }
    }
  }

  // Sort chronologically
  transactions.sort((a, b) => a.date.localeCompare(b.date));

  if (transactions.length === 0) {
    validationErrors.push(
      'No valid transaction records could be extracted from this PDF. Please check that the PDF contains a standard transaction table with dates and amounts.'
    );
  }

  return {
    success: transactions.length > 0,
    transactions,
    bankHint: extractResult.bankHint,
    pageCount: extractResult.pageCount,
    totalExtracted: transactions.length,
    invalidCount,
    balanceDiscrepancyCount,
    ignoredSummaryCount,
    validationErrors,
    rawTextPreview: lines.slice(0, 5).map((l) => l.text).join('\n'),
  };
}


/**
 * Dedicated parser for Google Pay (GPay) e-statements.
 * Handles 3-column format: Date & time | Transaction details | Amount
 * Accurately extracts sent/received, timestamps, UPI reference IDs, and counterparties.
 */
function parseGooglePayStatement(
  lines: PDFExtractedLine[],
  extractResult: { pageCount: number; bankHint?: string },
  options: {
    deduplicate?: boolean;
    autoCategorize?: boolean;
    defaultExcludeTransfers?: boolean;
  }
): PDFParseResult {
  const {
    deduplicate = true,
    autoCategorize = true,
    defaultExcludeTransfers = true,
  } = options;

  const transactions: Transaction[] = [];
  const seenSignatures = new Set<string>();
  let ignoredSummaryCount = 0;
  const validationErrors: string[] = [];

  let currentTx: {
    date: string;
    rawDate: string;
    direction: 'paid to' | 'received from';
    party: string;
    amount: number;
    type: TransactionType;
    debit?: number;
    credit?: number;
    refNo?: string;
    accountInfo?: string;
    time?: string;
    pageNumber: number;
    rawLines: string[];
  } | null = null;

  const finalizeTx = (tx: typeof currentTx) => {
    if (!tx) return;
    const parts = [
      tx.direction === 'received from' ? 'Received from' : 'Paid to',
      tx.party,
    ];
    if (tx.refNo) parts.push(tx.refNo);
    if (tx.accountInfo) parts.push('(' + tx.accountInfo + ')');
    if (tx.time) parts.push('at ' + tx.time);
    const rawNarration = parts.join(' ');
    const cleanMerchant = normalizeMerchant(tx.party);

    let category = 'Other & Miscellaneous';
    if (autoCategorize) {
      if (tx.type === 'income') {
        const lowerParty = tx.party.toLowerCase();
        if (
          lowerParty.includes('kulkarni') ||
          lowerParty.includes('arun') ||
          lowerParty.includes('sangeeta') ||
          lowerParty.includes('father') ||
          lowerParty.includes('mother') ||
          lowerParty.includes('allowance') ||
          lowerParty.includes('salary')
        ) {
          category = 'Income & Allowance';
        } else {
          category = suggestCategory(tx.party, 'income');
        }
      } else {
        category = suggestCategory(tx.party, 'expense');
        if (category === 'Other & Miscellaneous') {
          const lowerParty = tx.party.toLowerCase();
          if (
            lowerParty.includes('anurag') ||
            lowerParty.includes('ajay') ||
            lowerParty.includes('prasad') ||
            lowerParty.includes('nishanth') ||
            lowerParty.includes('koushik')
          ) {
            category = 'Transfers & Peer Payments';
          }
        }
      }
    }

    const isTransfer =
      category === 'Transfers & Peer Payments' ||
      category.toLowerCase().includes('transfer') ||
      tx.party.toLowerCase().includes('self transfer') ||
      tx.party.toLowerCase().includes('anurag kulkarni');

    const newTx: Transaction = {
      id: 'tx_gpay_' + Date.now() + '_' + transactions.length + '_' + Math.random().toString(36).substring(2, 6),
      date: tx.date,
      description: rawNarration,
      merchant: cleanMerchant,
      amount: tx.amount,
      debit: tx.debit,
      credit: tx.credit,
      refNo: tx.refNo,
      type: tx.type,
      category,
      excluded: defaultExcludeTransfers && isTransfer,
      pageNumber: tx.pageNumber,
      confidence: 0.99,
      raw: {
        sourceLine: tx.rawLines.join(' | '),
        page: String(tx.pageNumber),
        time: tx.time || "",
        accountInfo: tx.accountInfo || "",
      },
    };

    const dedupeKey = tx.date + '_' + (tx.refNo || tx.party) + '_' + tx.amount + '_' + tx.type;
    if (!deduplicate || !seenSignatures.has(dedupeKey)) {
      seenSignatures.add(dedupeKey);
      transactions.push(newTx);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text;

    // Filter summary / metadata headers
    if (
      /transaction statement period/i.test(text) ||
      /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\s*-\s*\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/i.test(text) ||
      /date\s*&\s*time\s+transaction details\s+amount/i.test(text) ||
      /note:\s*this statement reflects payments/i.test(text) ||
      /^page\s+\d+\s+of\s+\d+/i.test(text.trim()) ||
      /^\d{10},\s*[\w.-]+@[\w.-]+/i.test(text.trim()) ||
      text.trim() === 'Transaction statement' ||
      text.trim() === 'Google Pay' ||
      text.trim() === 'Powered by UPI'
    ) {
      ignoredSummaryCount++;
      continue;
    }

    // Match transaction header line:
    // e.g. "02 Sep, 2026   Received from Arun KULKARNI   ₹4,000"
    const headerMatch = text.match(
      /^(\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4})\s+(Paid to|Received from)\s+(.+?)\s+₹?\s*([\d,]+(?:\.\d{1,2})?)$/i
    );

    if (headerMatch) {
      if (currentTx) {
        finalizeTx(currentTx);
      }
      const rawDateStr = headerMatch[1].replace(',', '').trim();
      const direction = headerMatch[2].toLowerCase() as 'paid to' | 'received from';
      const party = headerMatch[3].trim();
      const rawAmount = headerMatch[4];
      const amount = normalizeAmount(rawAmount);
      const isIncome = direction.includes('received');
      const type: TransactionType = isIncome ? 'income' : 'expense';
      const date = normalizeDate(rawDateStr) || rawDateStr;

      currentTx = {
        date,
        rawDate: rawDateStr,
        direction,
        party,
        amount,
        type,
        debit: type === 'expense' ? amount : undefined,
        credit: type === 'income' ? amount : undefined,
        refNo: undefined,
        accountInfo: undefined,
        time: undefined,
        pageNumber: line.pageNumber,
        rawLines: [text],
      };
      continue;
    }

    // Secondary lines: time, UPI Transaction ID, and payment account
    if (currentTx) {
      currentTx.rawLines.push(text);

      const timeMatch = text.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/i);
      if (timeMatch && !currentTx.time) {
        currentTx.time = timeMatch[1];
      }

      const upiMatch = text.match(/UPI\s+Transaction\s+ID:\s*([A-Za-z0-9]+)/i);
      if (upiMatch && !currentTx.refNo) {
        currentTx.refNo = 'UPI/' + upiMatch[1];
      }

      const accMatch = text.match(/Paid\s+(?:to|by)\s+(.+)/i);
      if (accMatch && !currentTx.accountInfo) {
        currentTx.accountInfo = accMatch[0].trim();
      }
    }
  }

  if (currentTx) {
    finalizeTx(currentTx);
  }

  // Sort chronologically
  transactions.sort((a, b) => a.date.localeCompare(b.date));

  return {
    success: transactions.length > 0,
    transactions,
    bankHint: extractResult.bankHint || 'Google Pay',
    pageCount: extractResult.pageCount,
    totalExtracted: transactions.length,
    invalidCount: 0,
    balanceDiscrepancyCount: 0,
    ignoredSummaryCount,
    validationErrors,
    rawTextPreview: lines.slice(0, 5).map((l) => l.text).join('\n'),
  };
}
