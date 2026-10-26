import {
  parseRawCSV,
  buildTransactionsFromMapping,
  normalizeDate,
  normalizeAmount,
  findTableHeaderRow,
  parseCSVToRows,
} from '../csvParser';
import { suggestCategory, normalizeMerchant } from '../categorizer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log('🧪 Starting Indian Bank Statement Parser Test Suite...\n');
  let passed = 0;

  // TEST 1: Date Normalization
  console.log('Test 1: Indian Date Parsing');
  assert(normalizeDate('15/10/2026') === '2026-10-15', 'DD/MM/YYYY failed');
  assert(normalizeDate('05-11-2026') === '2026-11-05', 'DD-MM-YYYY failed');
  assert(normalizeDate('22/03/26') === '2026-03-22', 'DD/MM/YY failed');
  assert(normalizeDate('15 Oct 2026') === '2026-10-15', 'DD MMM YYYY failed');
  assert(normalizeDate('05-Nov-26') === '2026-11-05', 'DD-MMM-YY failed');
  assert(normalizeDate('2026-10-15') === '2026-10-15', 'ISO YYYY-MM-DD failed');
  assert(normalizeDate('invalid-date-string') === null, 'Invalid date must return null');
  assert(normalizeDate('') === null, 'Empty date must return null');
  console.log('✅ Date normalization passed');
  passed++;

  // TEST 2: Amount Normalization
  console.log('\nTest 2: Indian Currency and Amount Parsing');
  assert(normalizeAmount('₹1,50,000.50') === 150000.5, '₹ with commas failed');
  assert(normalizeAmount('Rs. 2,499.00') === 2499, 'Rs with commas failed');
  assert(normalizeAmount('120.00 Dr') === 120, 'Dr suffix failed');
  assert(normalizeAmount('(500.00)') === 500, 'Accounting parentheses failed');
  console.log('✅ Amount normalization passed');
  passed++;

  // TEST 3: SBI Statement with Header Metadata and Summary rows
  console.log('\nTest 3: SBI Bank Statement with Header Metadata');
  const sbiCSV = `Account Name: Rajesh Kumar
Account Number: 00000038912384912
Branch: KORAMANGALA BANGALORE
IFSC Code: SBIN0001234
Statement Period: 01-Oct-2026 to 31-Oct-2026

Txn Date,Value Date,Description,Ref No,Debit,Credit,Balance
01/10/2026,01/10/2026,OPENING BALANCE B/F,,,10000.00
02/10/2026,02/10/2026,UPI/428192837/SWIGGY/ICICI,UPI8912,350.00,,9650.00
03/10/2026,03/10/2026,UPI/428192838/NAMMA METRO SMART CARD,METRO44,200.00,,9450.00
05/10/2026,05/10/2026,BY TRANSFER STIPEND OCT 2026,NEFT999,,8000.00,17450.00
06/10/2026,06/10/2026,CLOSING BALANCE,,,17450.00`;

  const sbiParse = parseRawCSV(sbiCSV);
  assert(sbiParse.bankHint === 'State Bank of India', 'SBI Bank hint detection failed');
  assert(sbiParse.headerLineIndex === 5, `Expected header at row 5, got ${sbiParse.headerLineIndex}`);
  assert(sbiParse.detectedMapping.columnMode === 'separate_debit_credit', 'SBI column mode detection failed');
  assert(sbiParse.detectedMapping.debit === 'Debit', 'SBI debit column detection failed');
  assert(sbiParse.detectedMapping.credit === 'Credit', 'SBI credit column detection failed');

  const sbiBuilt = buildTransactionsFromMapping(sbiParse.rows, sbiParse.detectedMapping);
  // Opening and closing balance rows are ignored
  assert(sbiBuilt.transactions.length === 3, `Expected 3 active txns, got ${sbiBuilt.transactions.length}`);
  const swiggyTx = sbiBuilt.transactions.find((t) => t.description.includes('SWIGGY'));
  assert(swiggyTx !== undefined, 'Swiggy transaction not found');
  assert(swiggyTx?.amount === 350, 'Swiggy amount mismatch');
  assert(swiggyTx?.type === 'expense', 'Swiggy should be expense');
  assert(swiggyTx?.category === 'Food & Dining', `Swiggy category should be Food & Dining, got ${swiggyTx?.category}`);

  const stipendTx = sbiBuilt.transactions.find((t) => t.description.includes('STIPEND'));
  assert(stipendTx !== undefined, 'Stipend transaction not found');
  assert(stipendTx?.amount === 8000, 'Stipend amount mismatch');
  assert(stipendTx?.type === 'income', 'Stipend should be income');
  console.log('✅ SBI Statement parsing passed');
  passed++;

  // TEST 4: HDFC Statement format with Withdrawal / Deposit
  console.log('\nTest 4: HDFC Bank Statement with Withdrawal / Deposit Columns');
  const hdfcCSV = `Date,Narration,Chq/Ref No,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
10/10/2026,POS 4218392183 BLINKIT INSTANT,POS91238,10/10/2026,450.00,,8500.00
11/10/2026,UPI-ZOMATO-ORDER-1234,UPI9812,11/10/2026,280.00,,8220.00
12/10/2026,ACH DEBIT NETFLIX ENTERTAINMENT,ACH123,12/10/2026,199.00,,8021.00`;

  const hdfcParse = parseRawCSV(hdfcCSV);
  assert(hdfcParse.detectedMapping.columnMode === 'separate_debit_credit', 'HDFC mode failed');
  const hdfcBuilt = buildTransactionsFromMapping(hdfcParse.rows, hdfcParse.detectedMapping);
  assert(hdfcBuilt.transactions.length === 3, 'HDFC row count failed');
  assert(hdfcBuilt.balanceDiscrepancyCount === 0, 'HDFC balance should reconcile with 0 discrepancies');
  console.log('✅ HDFC Statement parsing passed');
  passed++;

  // TEST 5: Multiline Transaction Continuation
  console.log('\nTest 5: Multiline Narration Continuation');
  const multilineCSV = `Date,Particulars,Debit,Credit,Balance
15/10/2026,UPI/428192837/COLLEGE XEROX,65.00,,5000.00
,,AND LAB MANUAL PRINTING,,,
16/10/2026,CHAI POINT TEA,40.00,,4960.00`;

  const multiParse = parseRawCSV(multilineCSV);
  assert(multiParse.rows.length === 2, `Expected 2 rows after merging multiline, got ${multiParse.rows.length}`);
  const firstRowDesc = multiParse.rows[0]['Particulars'];
  assert(firstRowDesc.includes('AND LAB MANUAL PRINTING'), 'Continuation text was not merged into previous row');
  console.log('✅ Multiline narration continuation passed');
  passed++;

  // TEST 6: Running Balance Verification Discrepancy Detection
  console.log('\nTest 6: Balance Discrepancy Detection');
  const corruptedBalanceCSV = `Date,Description,Debit,Credit,Balance
20/10/2026,Expense 1,100.00,,1000.00
21/10/2026,Expense 2,100.00,,500.00`; // Delta is 500, but amount is 100!

  const corParse = parseRawCSV(corruptedBalanceCSV);
  const corBuilt = buildTransactionsFromMapping(corParse.rows, corParse.detectedMapping);
  assert(corBuilt.balanceDiscrepancyCount > 0, 'Expected balance discrepancy to be detected');
  assert(corBuilt.transactions[1].needsReview === true, 'Discrepant row should have needsReview flag');
  console.log('✅ Balance discrepancy detection passed');
  passed++;

  console.log(`\n🎉 All ${passed} test suites passed successfully!`);
}

runTests();
