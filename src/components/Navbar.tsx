import React from 'react';
import { Sparkles, UploadCloud } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'explorer' | 'privacy';
  onNavigate: (view: 'landing' | 'dashboard' | 'explorer' | 'privacy') => void;
  onOpenImport: () => void;
  onLaunchWrapped: () => void;
  hasData: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenImport,
  onLaunchWrapped,
  hasData,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-200/60 bg-[#FFFDF9]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="group flex items-center gap-2.5 text-left text-slate-800 transition-opacity hover:opacity-90 shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 font-bold text-white shadow-sm shadow-orange-300">
            MW
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Money Wrapped
          </span>
        </button>

        {/* Zone 2: Single-line clean navigation links (Overview, Dashboard, Transactions, Privacy) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 h-[20px] ${
              currentView === 'landing' ? 'text-orange-600 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          {hasData && (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'dashboard' ? 'text-orange-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('explorer')}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'explorer' ? 'text-orange-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                Transactions
              </button>
            </>
          )}
          <button
            onClick={() => onNavigate('privacy')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'privacy' ? 'text-orange-600 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Privacy
          </button>
        </nav>

        {/* Zone 3: Primary action button */}
        <div className="flex items-center gap-3 shrink-0">
          {hasData ? (
            <button
              onClick={onLaunchWrapped}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300/40 transition-all hover:brightness-105 active:scale-95 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span>Open My Wrapped</span>
            </button>
          ) : (
            <button
              onClick={onOpenImport}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange-400/30 transition-all hover:bg-orange-500 active:scale-95 whitespace-nowrap shrink-0"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Import Statement</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
