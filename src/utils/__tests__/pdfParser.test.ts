import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { parsePDFStatement } from '../pdfParser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPDFTests() {
  console.log('🧪 Starting Indian Bank Statement PDF Parser Test Suite...\n');
  let passed = 0;

  // TEST 1: Multi-Page SBI Bank Statement PDF
  console.log('Test 1: Multi-Page SBI Bank Statement PDF (Text-Based)');
  const sbiDoc = await PDFDocument.create();
  const font = await sbiDoc.embedFont(StandardFonts.Helvetica);

  // Page 1
  const page1 = sbiDoc.addPage([600, 800]);
  page1.drawText('STATE BANK OF INDIA - STATEMENT OF ACCOUNT', { x: 50, y: 750, size: 14, font, color: rgb(0, 0, 0) });
  page1.drawText('Account Name: Rajesh Kumar     Account No: 00000038912384912', { x: 50, y: 720, size: 10, font });
  page1.drawText('Branch: KORAMANGALA BANGALORE  IFSC: SBIN0001234', { x: 50, y: 700, size: 10, font });
  page1.drawText('Txn Date    Value Date   Description                       Ref No     Debit    Credit    Balance', { x: 50, y: 660, size: 9, font });
  page1.drawText('01/10/2026  01/10/2026   OPENING BALANCE B/F                                             10000.00', { x: 50, y: 640, size: 9, font });
  page1.drawText('02/10/2026  02/10/2026   UPI/428192837/SWIGGY/ICICI        REF8912    350.00             9650.00', { x: 50, y: 620, size: 9, font });
  page1.drawText('03/10/2026  03/10/2026   UPI/428192838/NAMMA METRO CARD    REF8913    200.00             9450.00', { x: 50, y: 600, size: 9, font });
  page1.drawText('05/10/2026  05/10/2026   BY TRANSFER STIPEND OCT 2026      NEFT999             8000.00  17450.00', { x: 50, y: 580, size: 9, font });
  page1.drawText('Page 1 of 2                                                     Contd... 2', { x: 50, y: 40, size: 8, font });

  // Page 2
  const page2 = sbiDoc.addPage([600, 800]);
  page2.drawText('STATE BANK OF INDIA - STATEMENT (Contd)', { x: 50, y: 750, size: 12, font });
  page2.drawText('Txn Date    Value Date   Description                       Ref No     Debit    Credit    Balance', { x: 50, y: 720, size: 9, font });
  page2.drawText('08/10/2026  08/10/2026   UPI/428192839/COLLEGE CANTEEN     REF8914     95.00            17355.00', { x: 50, y: 700, size: 9, font });
  page2.drawText('09/10/2026  09/10/2026   JIO 5G MONTHLY RECHARGE           REF8915    299.00            17056.00', { x: 50, y: 680, size: 9, font });
  page2.drawText('10/10/2026  10/10/2026   CLOSING BALANCE                                                 17056.00', { x: 50, y: 660, size: 9, font });
  page2.drawText('Page 2 of 2                                                     End of Statement', { x: 50, y: 40, size: 8, font });

  const sbiBytes = await sbiDoc.save();
  const sbiParsed = await parsePDFStatement(sbiBytes.buffer as ArrayBuffer);

  assert(sbiParsed.success, 'SBI PDF statement parsing failed');
  assert(sbiParsed.pageCount === 2, `Expected 2 pages, got ${sbiParsed.pageCount}`);
  assert(sbiParsed.bankHint === 'State Bank of India', `Expected SBI bank hint, got ${sbiParsed.bankHint}`);
  assert(sbiParsed.transactions.length === 5, `Expected 5 transactions, got ${sbiParsed.transactions.length}`);

  const swiggyTx = sbiParsed.transactions.find((t) => t.description.includes('SWIGGY'));
  assert(swiggyTx !== undefined, 'Swiggy transaction not found');
  assert(swiggyTx?.amount === 350, `Expected 350, got ${swiggyTx?.amount}`);
  assert(swiggyTx?.type === 'expense', 'Swiggy should be expense');
  assert(swiggyTx?.category === 'Food & Dining', `Swiggy category should be Food & Dining, got ${swiggyTx?.category}`);

  const stipendTx = sbiParsed.transactions.find((t) => t.description.includes('STIPEND'));
  assert(stipendTx !== undefined, 'Stipend transaction not found');
  assert(stipendTx?.amount === 8000, `Expected 8000, got ${stipendTx?.amount}`);
  assert(stipendTx?.type === 'income', 'Stipend should be income');
  assert(stipendTx?.category === 'Income & Allowance', `Category should be Income, got ${stipendTx?.category}`);

  // Page tracking verification
  const jioTx = sbiParsed.transactions.find((t) => t.description.includes('JIO'));
  assert(jioTx?.pageNumber === 2, `Expected Jio on page 2, got ${jioTx?.pageNumber}`);

  console.log('✅ Multi-page SBI PDF statement parsed successfully');
  passed++;

  // TEST 2: HDFC Statement with Multiline Narration
  console.log('\nTest 2: HDFC Statement with Multiline Narration');
  const hdfcDoc = await PDFDocument.create();
  const fontHdfc = await hdfcDoc.embedFont(StandardFonts.Helvetica);
  const pageHdfc = hdfcDoc.addPage([600, 800]);
  pageHdfc.drawText('HDFC BANK LIMITED - ACCOUNT STATEMENT', { x: 50, y: 750, size: 14, font: fontHdfc });
  pageHdfc.drawText('Date        Narration                         Chq/Ref No   Value Dt    Withdrawal   Deposit   Closing Balance', { x: 50, y: 700, size: 8, font: fontHdfc });
  pageHdfc.drawText('12/10/2026  POS 4218392183 BLINKIT INSTANT    REF991       12/10/2026     450.00               8500.00', { x: 50, y: 680, size: 8, font: fontHdfc });
  pageHdfc.drawText('            BANGALORE IN ORDER ID 99128', { x: 50, y: 665, size: 8, font: fontHdfc }); // continuation
  pageHdfc.drawText('13/10/2026  UPI-ZOMATO-ORDER-4421             REF992       13/10/2026     280.00               8220.00', { x: 50, y: 645, size: 8, font: fontHdfc });

  const hdfcBytes = await hdfcDoc.save();
  const hdfcParsed = await parsePDFStatement(hdfcBytes.buffer as ArrayBuffer);

  assert(hdfcParsed.success, 'HDFC PDF parsing failed');
  assert(hdfcParsed.bankHint === 'HDFC Bank', `Expected HDFC hint, got ${hdfcParsed.bankHint}`);
  assert(hdfcParsed.transactions.length === 2, `Expected 2 transactions, got ${hdfcParsed.transactions.length}`);

  const blinkitTx = hdfcParsed.transactions.find((t) => t.merchant === 'Blinkit');
  assert(blinkitTx !== undefined, 'Blinkit merchant transaction not found');
  assert(Boolean(blinkitTx?.description.includes('BANGALORE IN ORDER ID 99128')), 'Multiline continuation text was not merged');
  console.log('✅ HDFC Statement with multiline narration parsed successfully');
  passed++;

  // TEST 3: Scanned PDF Detection (No selectable text)
  console.log('\nTest 3: Scanned / Empty PDF Detection');
  const emptyDoc = await PDFDocument.create();
  emptyDoc.addPage([600, 800]); // Blank page without text items
  const emptyBytes = await emptyDoc.save();

  const emptyParsed = await parsePDFStatement(emptyBytes.buffer as ArrayBuffer);
  assert(!emptyParsed.success, 'Empty PDF should not report success');
  assert(emptyParsed.isScanned === true, 'Empty / image PDF should be flagged as scanned');
  assert(emptyParsed.validationErrors.length > 0, 'Validation errors should be populated');
  console.log('✅ Scanned PDF detection passed');
  passed++;

  // TEST 4: Invalid File Buffer Handling
  console.log('\nTest 4: Invalid / Corrupted Buffer Handling');
  const corruptedBuffer = new Uint8Array([1, 2, 3, 4, 5]).buffer as ArrayBuffer;
  const corruptedParsed = await parsePDFStatement(corruptedBuffer);
  assert(!corruptedParsed.success, 'Corrupted buffer should not report success');
  assert(corruptedParsed.validationErrors.length > 0, 'Corrupted buffer should report validation error');
  console.log('✅ Corrupted buffer handling passed');
  passed++;

  console.log(`\n🎉 All ${passed} PDF test suites passed successfully!`);
}

runPDFTests().catch((err) => {
  console.error('❌ PDF Test Runner Error:', err);
  process.exit(1);
});
