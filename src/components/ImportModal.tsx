import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  PlusCircle,
  Building2,
  Check,
  Filter,
  Lock,
  KeyRound,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { ColumnMapping, RawParseResult, Transaction } from '../types';
import {
  buildTransactionsFromMapping,
  downloadSampleCSVFile,
  parseRawCSV,
} from '../utils/csvParser';
import { parsePDFStatement } from '../utils/pdfParser';
import { SPENDING_CATEGORIES } from '../utils/categorizer';
import { formatINR } from '../utils/calculations';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (transactions: Transaction[]) => void;
  onLoadDemo: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onLoadDemo,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'review' | 'manual'>('upload');
  const [, setFile] = useState<File | null>(null);
  const [rawParse, setRawParse] = useState<RawParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    columnMode: 'separate_debit_credit',
  });
  const [deduplicate, setDeduplicate] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [excludeTransfers, setExcludeTransfers] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF-specific state
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfPassword, setPdfPassword] = useState('');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [pdfMeta, setPdfMeta] = useState<{ pageCount: number; bankHint?: string } | null>(null);

  // Parsed and review-ready transactions
  const [stagedTransactions, setStagedTransactions] = useState<Transaction[]>([]);
  const [filterNeedsReviewOnly, setFilterNeedsReviewOnly] = useState(false);

  // Manual entry state
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState<'expense' | 'income'>('expense');
  const [manualCategory, setManualCategory] = useState('Food & Dining');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (selectedFile: File) => {
    setErrorMsg(null);
    setIsPasswordRequired(false);
    setPdfPassword('');
    setPdfMeta(null);

    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt') && !fileName.endsWith('.pdf')) {
      setErrorMsg('Please upload a bank statement in PDF, CSV, or plain text format.');
      return;
    }

    setFile(selectedFile);

    // PDF processing path
    if (fileName.endsWith('.pdf')) {
      setIsProcessingPDF(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer || buffer.byteLength === 0) {
            setErrorMsg('The selected PDF file is empty.');
            setIsProcessingPDF(false);
            return;
          }
          setPdfArrayBuffer(buffer);

          const result = await parsePDFStatement(buffer, {
            deduplicate,
            autoCategorize,
            defaultExcludeTransfers: excludeTransfers,
          });
          setIsProcessingPDF(false);

          if (result.isPasswordProtected) {
            setIsPasswordRequired(true);
            setErrorMsg('This bank statement PDF is password-protected. Please enter your password to unlock it.');
            return;
          }

          if (result.isScanned) {
            setErrorMsg(
              result.error ||
                'Scanned image-based PDF detected. No selectable digital text was found. Please upload a digital e-statement PDF exported from net banking or mobile banking.'
            );
            return;
          }

          if (!result.success || result.transactions.length === 0) {
            setErrorMsg(
              result.error ||
                'No valid transactions could be extracted from this PDF statement. Please ensure it is an official bank statement containing a transaction table.'
            );
            return;
          }

          setPdfMeta({ pageCount: result.pageCount, bankHint: result.bankHint });
          setStagedTransactions(result.transactions);
          setStep('review');
        } catch (err: any) {
          setIsProcessingPDF(false);
          setErrorMsg(`Error processing PDF: ${err?.message || 'Could not parse document'}`);
        }
      };
      reader.onerror = () => {
        setIsProcessingPDF(false);
        setErrorMsg('Failed to read the PDF file.');
      };
      reader.readAsArrayBuffer(selectedFile);
      return;
    }

    // CSV / TXT processing path
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          setErrorMsg('The selected statement file is empty.');
          return;
        }

        const result = parseRawCSV(text);
        if (result.rows.length === 0) {
          setErrorMsg('No transaction records could be parsed. Check that the file contains tabular data.');
          return;
        }

        setRawParse(result);
        setMapping(result.detectedMapping);
        setStep('mapping');
      } catch {
        setErrorMsg('Error reading statement file. Please ensure it is a valid CSV or export.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
    };
    reader.readAsText(selectedFile);
  };

  const handleUnlockPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfArrayBuffer) return;
    setErrorMsg(null);
    setIsProcessingPDF(true);

    try {
      const result = await parsePDFStatement(pdfArrayBuffer, {
        password: pdfPassword.trim(),
        deduplicate,
        autoCategorize,
        defaultExcludeTransfers: excludeTransfers,
      });
      setIsProcessingPDF(false);

      if (result.isPasswordProtected) {
        setErrorMsg('Incorrect password. Indian bank statements commonly use Date of Birth (DDMMYYYY) or PAN.');
        return;
      }

      if (!result.success || result.transactions.length === 0) {
        setErrorMsg(result.error || 'Could not extract valid transaction rows with this password.');
        return;
      }

      setIsPasswordRequired(false);
      setPdfMeta({ pageCount: result.pageCount, bankHint: result.bankHint });
      setStagedTransactions(result.transactions);
      setStep('review');
    } catch (err: any) {
      setIsProcessingPDF(false);
      setErrorMsg(`Failed to unlock PDF: ${err?.message || 'Decryption error'}`);
    }
  };

  const handleLoadGooglePayStatement = async () => {
    setIsProcessingPDF(true);
    setErrorMsg(null);
    try {
      const resp = await fetch('/assets/aistudio/gpay_statement_20260901_20260930_70b536e1.pdf');
      if (!resp.ok) {
        throw new Error('Failed to load Google Pay statement');
      }
      const buffer = await resp.arrayBuffer();
      const result = await parsePDFStatement(buffer, {
        deduplicate,
        autoCategorize,
        defaultExcludeTransfers: excludeTransfers,
      });

      if (!result.success || result.transactions.length === 0) {
        setErrorMsg(result.error || 'No transactions could be parsed from the Google Pay statement.');
        setIsProcessingPDF(false);
        return;
      }

      setPdfMeta({ pageCount: result.pageCount, bankHint: result.bankHint });
      setStagedTransactions(result.transactions);
      setIsProcessingPDF(false);
      setStep('review');
    } catch (err: any) {
      setIsProcessingPDF(false);
      setErrorMsg(`Could not process Google Pay statement: ${err?.message || 'Read error'}`);
    }
  };

  const handleLoadSampleStatement = async () => {
    setIsProcessingPDF(true);
    setErrorMsg(null);
    try {
      const resp = await fetch('/assets/aistudio/ANURAG_KULKARNI_5789a3aa.pdf');
      if (!resp.ok) {
        throw new Error('Failed to load sample statement');
      }
      const buffer = await resp.arrayBuffer();
      const result = await parsePDFStatement(buffer, {
        deduplicate,
        autoCategorize,
        defaultExcludeTransfers: excludeTransfers,
      });

      if (!result.success || result.transactions.length === 0) {
        setErrorMsg(result.error || 'No transactions could be parsed from the statement.');
        setIsProcessingPDF(false);
        return;
      }

      setPdfMeta({ pageCount: result.pageCount, bankHint: result.bankHint });
      setStagedTransactions(result.transactions);
      setIsProcessingPDF(false);
      setStep('review');
    } catch (err: any) {
      setIsProcessingPDF(false);
      setErrorMsg(`Could not process statement: ${err?.message || 'Read error'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleProceedToReview = () => {
    if (!rawParse) return;
    if (!mapping.date || !mapping.description) {
      setErrorMsg('Please map both Date and Description columns.');
      return;
    }

    if (
      mapping.columnMode === 'separate_debit_credit' &&
      !mapping.debit &&
      !mapping.credit
    ) {
      setErrorMsg('Please map at least Debit/Withdrawal or Credit/Deposit column.');
      return;
    }

    if (mapping.columnMode !== 'separate_debit_credit' && !mapping.amount) {
      setErrorMsg('Please map Amount column.');
      return;
    }

    const { transactions, invalidCount } = buildTransactionsFromMapping(rawParse.rows, mapping, {
      deduplicate,
      autoCategorize,
      defaultExcludeTransfers: excludeTransfers,
    });

    if (transactions.length === 0) {
      setErrorMsg(
        invalidCount > 0
          ? `All ${invalidCount} rows were invalid or had missing amounts/dates.`
          : 'No valid transactions could be generated from the selected columns.'
      );
      return;
    }

    setErrorMsg(null);
    setStagedTransactions(transactions);
    setStep('review');
  };

  const handleFinalizeImport = () => {
    if (stagedTransactions.length === 0) return;
    onImportSuccess(stagedTransactions);
    onClose();
  };

  const handleUpdateStagedCategory = (id: string, newCategory: string) => {
    setStagedTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category: newCategory, needsReview: false } : t))
    );
  };

  const handleToggleStagedExclusion = (id: string) => {
    setStagedTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, excluded: !t.excluded } : t))
    );
  };

  const handleAddManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }
    if (!manualDesc.trim()) {
      setErrorMsg('Please enter a description or merchant name.');
      return;
    }

    const newTx: Transaction = {
      id: `manual_${Date.now()}`,
      date: manualDate,
      description: manualDesc.trim(),
      merchant: manualDesc.trim(),
      amount: amt,
      type: manualType,
      category: manualCategory,
      excluded: false,
    };

    onImportSuccess([newTx]);
    onClose();
  };

  const reviewPendingCount = stagedTransactions.filter((t) => t.needsReview).length;
  const totalOutflows = stagedTransactions
    .filter((t) => !t.excluded && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const totalInflows = stagedTransactions
    .filter((t) => !t.excluded && t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const displayedStagedTx = filterNeedsReviewOnly
    ? stagedTransactions.filter((t) => t.needsReview)
    : stagedTransactions;

  const currentBankHint = pdfMeta?.bankHint || rawParse?.bankHint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-orange-100">
          <div>
            <div className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {step === 'upload' && 'Import Real Statement (PDF or CSV)'}
                {step === 'mapping' && 'Statement Column Mapping'}
                {step === 'review' && 'Statement Verification & Review'}
                {step === 'manual' && 'Manual Transaction Entry'}
              </h2>
              {currentBankHint && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                  <Building2 className="h-3 w-3" />
                  {currentBankHint}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              100% Client-side bank statement processing · zero server transmission
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-orange-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-4 flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Upload Step */}
        {step === 'upload' && (
          <div className="mt-5 space-y-6">
            {/* Password Unlock Form if Protected PDF */}
            {isPasswordRequired ? (
              <form
                onSubmit={handleUnlockPDF}
                className="rounded-3xl border-2 border-orange-300 bg-orange-50/50 p-6 space-y-4 animate-in fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Enter Password to Unlock Bank PDF
                    </h3>
                    <p className="text-xs text-slate-600">
                      Indian banks commonly password-protect statements using your DOB (e.g. DDMMYYYY) or PAN.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      placeholder="e.g. 15082002 or PAN Number"
                      className="w-full rounded-xl border border-orange-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordRequired(false);
                      setPdfArrayBuffer(null);
                      setErrorMsg(null);
                    }}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPDF}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300 hover:bg-orange-500 disabled:opacity-50 transition-colors"
                  >
                    {isProcessingPDF ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Decrypting PDF...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Unlock & Extract Transactions</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Drag and Drop Box */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-orange-200/90 hover:border-orange-400 hover:bg-orange-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-3">
                  {isProcessingPDF ? (
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  ) : (
                    <FileText className="h-6 w-6" />
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {isProcessingPDF
                    ? 'Parsing multi-page PDF statement...'
                    : 'Drop your Bank Statement PDF or CSV here, or browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Works directly with e-statement PDFs and CSVs from{' '}
                  <strong>Standard Chartered, HDFC, SBI, ICICI, Axis, Kotak, Canara</strong>, Barclays, HSBC, Google Pay, PhonePe, and Paytm
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <span>Supports multi-page digital PDFs with multiline narrations & running balance audit</span>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                            <button
                type="button"
                onClick={handleLoadGooglePayStatement}
                disabled={isProcessingPDF}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">G</span>
                <span>Test Google Pay PDF (3 Pgs)</span>
              </button>
<button
                type="button"
                onClick={handleLoadSampleStatement}
                disabled={isProcessingPDF}
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-50 border border-orange-200 p-3 text-xs font-semibold text-orange-800 hover:bg-orange-100 transition-colors shadow-xs"
              >
                <Building2 className="h-3.5 w-3.5 text-orange-600" />
                <span>Test Standard Chartered PDF (13 Pgs)</span>
              </button>

              <button
                type="button"
                onClick={downloadSampleCSVFile}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>Download Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('manual')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Enter Manually</span>
              </button>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-slate-600 leading-relaxed space-y-1">
              <p className="text-slate-900 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Zero Cloud Uploads · Private Local Parsing
              </p>
              <p>
                Your PDF and transaction data remain strictly on your device. We use in-browser parsing to extract tables and calculate your Money Wrapped report without storing or uploading files anywhere.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: CSV Column Mapping (for CSV/TXT files) */}
        {step === 'mapping' && rawParse && (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl bg-orange-50/60 border border-orange-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">Header row #{rawParse.headerLineIndex + 1}:</span>
                <span className="font-bold text-slate-900 tabular-nums">{rawParse.totalRows} data rows</span>
                {rawParse.ignoredSummaryRows > 0 && (
                  <span className="text-slate-500">
                    ({rawParse.ignoredSummaryRows} balance/summary rows filtered)
                  </span>
                )}
                {rawParse.duplicateRows > 0 && (
                  <span className="text-amber-700 font-medium">({rawParse.duplicateRows} duplicates)</span>
                )}
              </div>
              <button
                onClick={() => setStep('upload')}
                className="text-orange-600 font-semibold hover:underline"
              >
                Change file
              </button>
            </div>

            {/* Column Layout Mode Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Statement Amount Format:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMapping({ ...mapping, columnMode: 'separate_debit_credit' })}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                    mapping.columnMode === 'separate_debit_credit'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Separate Columns</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Debit/Withdrawal & Credit/Deposit</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMapping({ ...mapping, columnMode: 'single_amount_type' })}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                    mapping.columnMode === 'single_amount_type'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Amount + Dr/Cr Flag</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Single Amount with Type Column</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMapping({ ...mapping, columnMode: 'signed_amount' })}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                    mapping.columnMode === 'signed_amount'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Signed Amount</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Negative (-) for debits, (+) credits</p>
                </button>
              </div>
            </div>

            {/* Core Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Date <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mapping.date}
                  onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select Date Column</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Narration / Description / Payee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mapping.description}
                  onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select Description Column</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode-specific Amount Columns */}
            {mapping.columnMode === 'separate_debit_credit' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Debit / Withdrawal Column (Outflow)
                  </label>
                  <select
                    value={mapping.debit || ''}
                    onChange={(e) => setMapping({ ...mapping, debit: e.target.value })}
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select Debit Column</option>
                    {rawParse.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit / Deposit Column (Inflow)
                  </label>
                  <select
                    value={mapping.credit || ''}
                    onChange={(e) => setMapping({ ...mapping, credit: e.target.value })}
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select Credit Column</option>
                    {rawParse.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : mapping.columnMode === 'single_amount_type' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Column <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mapping.amount || ''}
                    onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select Amount Column</option>
                    {rawParse.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type / Dr/Cr Flag Column <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mapping.type || ''}
                    onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select Type Column</option>
                    {rawParse.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Signed Amount Column <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mapping.amount || ''}
                  onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select Amount Column</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Running Balance (Optional)
                </label>
                <select
                  value={mapping.balance || ''}
                  onChange={(e) => setMapping({ ...mapping, balance: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">None (skip balance check)</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Value Date (Optional)
                </label>
                <select
                  value={mapping.valueDate || ''}
                  onChange={(e) => setMapping({ ...mapping, valueDate: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">None</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ref / Cheque No (Optional)
                </label>
                <select
                  value={mapping.refNo || ''}
                  onChange={(e) => setMapping({ ...mapping, refNo: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">None</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setStep('upload')}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back
              </button>
              <button
                onClick={handleProceedToReview}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300 hover:bg-orange-500 transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Validate & Review Statement</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Verification Step (Used for BOTH PDF & CSV!) */}
        {step === 'review' && (
          <div className="mt-5 space-y-4">
            {/* PDF Banner info if from PDF */}
            {pdfMeta && (
              <div className="rounded-2xl bg-orange-50/80 border border-orange-200 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-orange-600 shrink-0" />
                  <span className="font-semibold text-slate-800">
                    PDF E-Statement Processed ({pdfMeta.pageCount} {pdfMeta.pageCount === 1 ? 'Page' : 'Pages'})
                  </span>
                  {pdfMeta.bankHint && (
                    <span className="text-orange-800 font-bold">· {pdfMeta.bankHint}</span>
                  )}
                </div>
                <span className="text-slate-500 tabular-nums">
                  {stagedTransactions.length} transactions extracted
                </span>
              </div>
            )}

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-2xl bg-orange-50/70 border border-orange-200 p-3">
                <p className="text-[11px] font-medium text-slate-500">Transactions</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">
                  {stagedTransactions.length}
                </p>
              </div>

              <div className="rounded-2xl bg-rose-50/70 border border-rose-200 p-3">
                <p className="text-[11px] font-medium text-slate-500">Total Outflow</p>
                <p className="text-lg font-bold text-rose-700 tabular-nums">
                  {formatINR(totalOutflows)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3">
                <p className="text-[11px] font-medium text-slate-500">Total Inflow</p>
                <p className="text-lg font-bold text-emerald-700 tabular-nums">
                  {formatINR(totalInflows)}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-3 ${
                  reviewPendingCount > 0
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <p className="text-[11px] font-medium text-slate-500">Audit Status</p>
                <p
                  className={`text-xs font-bold mt-1 ${
                    reviewPendingCount > 0 ? 'text-amber-800' : 'text-emerald-800'
                  }`}
                >
                  {reviewPendingCount > 0
                    ? `${reviewPendingCount} items flagged`
                    : 'All items verified'}
                </p>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterNeedsReviewOnly(!filterNeedsReviewOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                    filterNeedsReviewOnly
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>
                    {filterNeedsReviewOnly ? 'Showing Flagged Only' : 'Show Flagged Items Only'}
                  </span>
                  {reviewPendingCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                      {reviewPendingCount}
                    </span>
                  )}
                </button>
              </div>
              <span className="text-slate-400 text-[11px]">
                Showing {displayedStagedTx.length} of {stagedTransactions.length} items
              </span>
            </div>

            {/* Verification Table */}
            <div className="rounded-2xl border border-orange-200 overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-orange-50 text-slate-700 sticky top-0 border-b border-orange-200">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Description & Merchant</th>
                    <th className="px-3 py-2 font-semibold text-right">Amount</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold text-center">Include</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 text-slate-800">
                  {displayedStagedTx.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`hover:bg-orange-50/40 ${
                        tx.needsReview ? 'bg-amber-50/50' : ''
                      } ${tx.excluded ? 'opacity-50 line-through' : ''}`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {tx.date || <span className="text-rose-600 font-bold">Missing Date</span>}
                        {tx.pageNumber && (
                          <span className="block text-[10px] text-slate-400">P.{tx.pageNumber}</span>
                        )}
                        {tx.validationIssues?.includes('BALANCE_DISCREPANCY') && (
                          <span className="block text-[10px] text-amber-600">Bal Mismatch</span>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-[240px]">
                        <p className="font-semibold text-slate-900 truncate">{tx.merchant}</p>
                        <p className="text-[11px] text-slate-500 truncate">{tx.description}</p>
                        {tx.refNo && (
                          <p className="text-[10px] font-mono text-slate-400 truncate">
                            Ref: {tx.refNo}
                          </p>
                        )}
                      </td>
                      <td
                        className={`px-3 py-2 whitespace-nowrap text-right font-bold tabular-nums ${
                          tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={tx.category}
                          onChange={(e) => handleUpdateStagedCategory(tx.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-orange-500"
                        >
                          {SPENDING_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={!tx.excluded}
                          onChange={() => handleToggleStagedExclusion(tx.id)}
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                          title="Toggle inclusion in Wrapped report"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Upload Different File
              </button>
              <button
                type="button"
                onClick={handleFinalizeImport}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300 hover:bg-orange-500 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Generate Money Wrapped</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Manual Entry Mode */}
        {step === 'manual' && (
          <form onSubmit={handleAddManualTransaction} className="mt-5 space-y-4">
            <p className="text-xs text-slate-600">
              Add individual transactions manually if you prefer not to upload a statement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 120"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Merchant
              </label>
              <input
                type="text"
                placeholder="e.g. College Canteen Masala Dosa"
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                required
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as 'expense' | 'income')}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                >
                  <option value="expense">Expense (Spending)</option>
                  <option value="income">Income / Allowance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                >
                  {SPENDING_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back to Upload
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300 hover:bg-orange-500 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
