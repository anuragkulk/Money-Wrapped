import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { WrappedStory } from './components/WrappedStory';
import { TransactionExplorer } from './components/TransactionExplorer';
import { ImportModal } from './components/ImportModal';
import { ShareModal } from './components/ShareModal';
import { Transaction } from './types';
import { DEMO_TRANSACTIONS } from './data/demoData';
import { computeWrappedMetrics } from './utils/calculations';
import { CheckCircle2, AlertCircle, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'fincosmos_money_wrapped_v1';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
    return [];
  });

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'explorer'>('landing');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute live Money Wrapped metrics whenever transactions change
  const metrics = useMemo(() => {
    return computeWrappedMetrics(transactions);
  }, [transactions]);

  // Persist transactions to localStorage
  useEffect(() => {
    try {
      if (transactions.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // LocalStorage quota or access issue
    }
  }, [transactions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const handleImportSuccess = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    setCurrentView('dashboard');
    showToast(`Successfully imported ${newTransactions.length} transactions!`);
  };

  const handleLoadDemo = () => {
    setTransactions(DEMO_TRANSACTIONS);
    setCurrentView('dashboard');
    showToast('Demo dataset loaded for October 2026!');
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    showToast('Transaction updated');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction removed');
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
    showToast('Transaction added');
  };

  const handleClearAllData = () => {
    setTransactions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsClearModalOpen(false);
    setCurrentView('landing');
    showToast('All transaction records cleared from your browser.');
  };

  const hasData = transactions.length > 0;

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-orange-200 bg-white/95 px-4 py-3 text-xs font-semibold text-slate-800 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Top Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenImport={() => setIsImportOpen(true)}
        onLaunchWrapped={() => setIsWrappedOpen(true)}
        hasData={hasData}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onStartImport={() => setIsImportOpen(true)}
            onLoadDemo={handleLoadDemo}
            onLaunchWrapped={() => setIsWrappedOpen(true)}
            hasData={hasData}
            totalExpenses={metrics.totalExpenses || 4890}
            monthName={metrics.reportingPeriod.monthName || 'October'}
            topCategory={metrics.topCategory?.category || 'Food & Dining'}
            personalityTitle={metrics.personality.title || 'The Foodie'}
          />
        )}

        {currentView === 'dashboard' && (
          hasData ? (
            <DashboardView
              metrics={metrics}
              onLaunchWrapped={() => setIsWrappedOpen(true)}
              onOpenImport={() => setIsImportOpen(true)}
              onNavigateToExplorer={() => setCurrentView('explorer')}
            />
          ) : (
            <div className="mx-auto max-w-xl text-center py-24 px-4 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">No Transactions Loaded</h2>
              <p className="text-xs text-slate-500">
                Import your transaction CSV or try the demo dataset to view your dashboard.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 shadow-md shadow-orange-300"
                >
                  Import CSV
                </button>
                <button
                  onClick={handleLoadDemo}
                  className="rounded-xl border border-orange-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-slate-900 shadow-xs"
                >
                  Load Demo Data
                </button>
              </div>
            </div>
          )
        )}

        {currentView === 'explorer' && (
          <TransactionExplorer
            transactions={transactions}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddTransaction={handleAddTransaction}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        hasData={hasData}
        onClearData={() => setIsClearModalOpen(true)}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
        onLoadDemo={handleLoadDemo}
      />

      {/* Spotify Wrapped 8-Slide Story Experience */}
      {isWrappedOpen && (
        <WrappedStory
          metrics={metrics}
          onClose={() => setIsWrappedOpen(false)}
          onOpenShare={() => {
            setIsWrappedOpen(false);
            setIsShareOpen(true);
          }}
        />
      )}

      {/* Share & Download Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        metrics={metrics}
      />

      {/* Clear Data Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">Clear All Local Data?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove all {transactions.length} imported transaction records and your cached Money Wrapped report from this device.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-sm"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
