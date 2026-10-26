import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatINR, formatReadableDate } from '../utils/calculations';
import { SPENDING_CATEGORIES } from '../utils/categorizer';

interface TransactionExplorerProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransaction: (newTx: Transaction) => void;
  onBackToDashboard: () => void;
}

export const TransactionExplorer: React.FC<TransactionExplorerProps> = ({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
  onBackToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'expense' | 'income' | 'transfer' | 'excluded' | 'needsReview'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New transaction form
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState('Food & Dining');

  // Filtered & sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchMerchant = t.merchant.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchRef = t.refNo ? t.refNo.toLowerCase().includes(q) : false;
          if (!matchDesc && !matchMerchant && !matchCat && !matchRef) return false;
        }

        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
          return false;
        }

        if (typeFilter === 'excluded') {
          return t.excluded;
        } else if (typeFilter === 'needsReview') {
          return t.needsReview;
        } else if (typeFilter !== 'ALL') {
          return t.type === typeFilter;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'desc'
            ? b.date.localeCompare(a.date)
            : a.date.localeCompare(b.date);
        } else {
          return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
        }
      });
  }, [transactions, searchQuery, categoryFilter, typeFilter, sortField, sortOrder]);

  const handleToggleExclude = (tx: Transaction) => {
    onUpdateTransaction({
      ...tx,
      excluded: !tx.excluded,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    onUpdateTransaction(editingTx);
    setEditingTx(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) return;

    onAddTransaction({
      id: `manual_${Date.now()}`,
      date: newDate,
      description: newDesc.trim() || 'New Expense',
      merchant: newDesc.trim() || 'Merchant',
      amount: amt,
      type: newType,
      category: newCategory,
      excluded: false,
    });

    setIsAddingNew(false);
    setNewDesc('');
    setNewAmount('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 bg-[#FFFDF9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Transaction Explorer</span>
            <span className="text-xs font-mono font-normal text-slate-500">
              ({filteredTransactions.length} of {transactions.length})
            </span>
          </h1>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300 hover:bg-orange-500 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by merchant, description or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-orange-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none shadow-xs"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none shadow-xs"
          >
            <option value="ALL">All Categories</option>
            {SPENDING_CATEGORIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="md:col-span-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none shadow-xs"
          >
            <option value="ALL">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Incomes Only</option>
            <option value="transfer">Transfers</option>
            <option value="needsReview">Needs Review / Flagged</option>
            <option value="excluded">Excluded Rows</option>
          </select>
        </div>

        {/* Sort Trigger */}
        <div className="md:col-span-2 flex items-center gap-1.5">
          <button
            onClick={() => {
              if (sortField === 'date') {
                setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
              } else {
                setSortField('date');
                setSortOrder('desc');
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
              sortField === 'date'
                ? 'border-orange-300 bg-orange-50 text-orange-700'
                : 'border-orange-200 bg-white text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>Date {sortField === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
          </button>

          <button
            onClick={() => {
              if (sortField === 'amount') {
                setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
              } else {
                setSortField('amount');
                setSortOrder('desc');
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
              sortField === 'amount'
                ? 'border-orange-300 bg-orange-50 text-orange-700'
                : 'border-orange-200 bg-white text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>Amount {sortField === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-orange-100 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-orange-50/80 text-slate-700 border-b border-orange-100">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Date</th>
                <th className="px-4 py-3.5 font-semibold">Description / Merchant</th>
                <th className="px-4 py-3.5 font-semibold">Category</th>
                <th className="px-4 py-3.5 font-semibold text-right">Amount</th>
                <th className="px-4 py-3.5 font-semibold text-center">In Report</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100/70 text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No transactions match your current filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-orange-50/40 transition-colors ${
                      tx.needsReview ? 'bg-amber-50/40' : ''
                    } ${tx.excluded ? 'opacity-50 line-through' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono">
                      {tx.date ? (
                        formatReadableDate(tx.date)
                      ) : (
                        <span className="text-rose-600 font-bold">No Date</span>
                      )}
                      {tx.valueDate && tx.valueDate !== tx.date && (
                        <span className="block text-[10px] text-slate-400">
                          Val: {formatReadableDate(tx.valueDate)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 max-w-[260px]">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 truncate">{tx.merchant}</p>
                        {tx.needsReview && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                            Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{tx.description}</p>
                      {tx.refNo && (
                        <p className="text-[10px] font-mono text-slate-400 truncate">Ref: {tx.refNo}</p>
                      )}
                      {tx.validationIssues && tx.validationIssues.length > 0 && (
                        <p className="text-[10px] text-amber-600 font-medium">
                          {tx.validationIssues.join(', ')}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[11px] font-mono text-slate-600 font-medium">
                        {tx.category}
                      </span>
                    </td>

                    <td
                      className={`px-4 py-3 whitespace-nowrap font-mono text-right font-bold tabular-nums ${
                        tx.type === 'income'
                          ? 'text-emerald-600'
                          : tx.type === 'transfer'
                          ? 'text-slate-500'
                          : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleExclude(tx)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          tx.excluded
                            ? 'text-slate-400 hover:text-slate-600 bg-slate-100'
                            : 'text-emerald-700 hover:text-emerald-800 bg-emerald-100'
                        }`}
                        title={tx.excluded ? 'Include in Wrapped calculations' : 'Exclude from calculations'}
                      >
                        {tx.excluded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-orange-50 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h3 className="text-base font-bold text-slate-900">Edit Transaction</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={editingTx.date}
                onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                required
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={editingTx.description}
                onChange={(e) =>
                  setEditingTx({ ...editingTx, description: e.target.value, merchant: e.target.value })
                }
                required
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={editingTx.amount}
                  onChange={(e) =>
                    setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={editingTx.type}
                  onChange={(e) =>
                    setEditingTx({ ...editingTx, type: e.target.value as TransactionType })
                  }
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={editingTx.category}
                onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              >
                {SPENDING_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Transaction</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this transaction record? This will immediately recalculate all Wrapped report metrics.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingTxId(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction(deletingTxId);
                  setDeletingTxId(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Transaction Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateNew}
            className="w-full max-w-md rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h3 className="text-base font-bold text-slate-900">Add New Transaction</h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Canteen Tea & Snack"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 50"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TransactionType)}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              >
                {SPENDING_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Record</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
