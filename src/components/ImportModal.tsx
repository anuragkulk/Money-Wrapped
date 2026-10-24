import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { ColumnMapping, RawParseResult, Transaction } from '../types';
import {
  buildTransactionsFromMapping,
  downloadSampleCSVFile,
  parseRawCSV,
} from '../utils/csvParser';

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
  const [step, setStep] = useState<'upload' | 'mapping' | 'manual'>('upload');
  const [, setFile] = useState<File | null>(null);
  const [rawParse, setRawParse] = useState<RawParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [deduplicate, setDeduplicate] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [excludeTransfers, setExcludeTransfers] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      setErrorMsg('Please upload a .csv or plain text transaction export file.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          setErrorMsg('The selected file is empty.');
          return;
        }

        const result = parseRawCSV(text);
        if (result.rows.length === 0) {
          setErrorMsg('No valid transaction records could be parsed from this file.');
          return;
        }

        setRawParse(result);
        setMapping(result.detectedMapping);
        setStep('mapping');
      } catch {
        setErrorMsg('Error reading statement file. Please ensure it is a valid CSV.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmMapping = () => {
    if (!rawParse) return;
    if (!mapping.date || !mapping.description || !mapping.amount) {
      setErrorMsg('Please map Date, Description, and Amount columns.');
      return;
    }

    const { transactions } = buildTransactionsFromMapping(rawParse.rows, mapping, {
      deduplicate,
      autoCategorize,
      defaultExcludeTransfers: excludeTransfers,
    });

    if (transactions.length === 0) {
      setErrorMsg('No valid transactions could be generated from the selected columns.');
      return;
    }

    onImportSuccess(transactions);
    onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-orange-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-orange-600" />
              <span>Import Statement</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure in-browser statement processor · zero server upload
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
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Upload Step */}
        {step === 'upload' && (
          <div className="mt-5 space-y-6">
            {/* Drag and Drop Box */}
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
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                Drop your CSV file here, or <span className="text-orange-600 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports UPI exports, Google Pay, PhonePe, Paytm, and Bank statement CSVs
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <span>Suggested format: Date, Description, Amount, Type</span>
              </div>
            </div>

            {/* Helper Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => {
                  onLoadDemo();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-50/80 border border-orange-200 p-3 text-xs font-semibold text-orange-800 hover:bg-orange-100 transition-colors shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                <span>Try Demo Data</span>
              </button>

              <button
                onClick={downloadSampleCSVFile}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>Sample CSV</span>
              </button>

              <button
                onClick={() => setStep('manual')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Manual Entry</span>
              </button>
            </div>

            {/* Privacy notice box */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-slate-600 leading-relaxed space-y-1">
              <p className="text-slate-900 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Browser-local computation
              </p>
              <p>
                FinCosmos does not send your financial statement anywhere. Parsing, calculations, and Wrapped report slides are generated directly inside your browser sandbox.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Column Mapping & Validation Step */}
        {step === 'mapping' && rawParse && (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl bg-orange-50/60 border border-orange-200 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">Parsed:</span>
                <span className="font-bold text-slate-900 tabular-nums">{rawParse.totalRows} rows</span>
                {rawParse.duplicateRows > 0 && (
                  <span className="text-amber-700 font-medium">({rawParse.duplicateRows} duplicates found)</span>
                )}
              </div>
              <button
                onClick={() => setStep('upload')}
                className="text-orange-600 font-semibold hover:underline"
              >
                Change file
              </button>
            </div>

            {/* Column Mapping Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date Column <span className="text-rose-500">*</span>
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
                  Description / Payee <span className="text-rose-500">*</span>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mapping.amount}
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
            </div>

            {/* Optional Type and Category Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Type / Dr/Cr Column (Optional)
                </label>
                <select
                  value={mapping.type || ''}
                  onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Auto-infer from description / amounts</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Category Column (Optional)
                </label>
                <select
                  value={mapping.category || ''}
                  onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Auto-categorize with smart keywords</option>
                  {rawParse.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row Preview Table */}
            <div>
              <p className="text-xs font-semibold text-slate-800 mb-2">First 3 Rows Preview</p>
              <div className="rounded-2xl border border-orange-200 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-orange-50/70 text-slate-700 border-b border-orange-200">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Mapped Date</th>
                      <th className="px-3 py-2 font-semibold">Mapped Description</th>
                      <th className="px-3 py-2 font-semibold">Mapped Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 text-slate-800 font-mono">
                    {rawParse.rows.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/30">
                        <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                          {mapping.date ? row[mapping.date] || '—' : '—'}
                        </td>
                        <td className="px-3 py-2 truncate max-w-[200px] text-slate-900 font-sans font-medium">
                          {mapping.description ? row[mapping.description] || '—' : '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-emerald-700 font-bold">
                          {mapping.amount ? row[mapping.amount] || '—' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-orange-100">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Remove exact duplicate transactions</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCategorize}
                  onChange={(e) => setAutoCategorize(e.target.checked)}
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Auto-categorize transactions using student keywords</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeTransfers}
                  onChange={(e) => setExcludeTransfers(e.target.checked)}
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Exclude self-transfers and peer UPI settlements from spending total</span>
              </label>
            </div>

            {/* Confirm Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setStep('upload')}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back
              </button>
              <button
                onClick={handleConfirmMapping}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300 hover:bg-orange-500 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Generate Wrapped</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Manual Entry Mode */}
        {step === 'manual' && (
          <form onSubmit={handleAddManualTransaction} className="mt-5 space-y-4">
            <p className="text-xs text-slate-600">
              Add individual transactions manually if you do not have a CSV export handy.
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Merchant</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
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
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transport & Commute">Transport & Commute</option>
                  <option value="Education & Academics">Education & Academics</option>
                  <option value="Groceries & Quick Commerce">Groceries & Quick Commerce</option>
                  <option value="Shopping & Lifestyle">Shopping & Lifestyle</option>
                  <option value="Entertainment & OTT">Entertainment & OTT</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Health & Personal Care">Health & Personal Care</option>
                  <option value="Income & Allowance">Income & Allowance</option>
                  <option value="Other & Miscellaneous">Other & Miscellaneous</option>
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
