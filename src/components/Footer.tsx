import React from 'react';
import { downloadSampleCSVFile } from '../utils/csvParser';

interface FooterProps {
  onClearData?: () => void;
  hasData?: boolean;
  onNavigate?: (view: 'landing' | 'dashboard' | 'explorer' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({ onClearData, hasData, onNavigate }) => {
  return (
    <footer className="border-t border-orange-100 bg-[#FFF9F3] text-slate-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-orange-200/60">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-500 to-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                FC
              </div>
              <span className="text-slate-900 font-bold text-sm tracking-tight">FINCOSMOS</span>
              <span className="text-xs text-orange-600 font-mono font-medium">· RNSIT</span>
            </div>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              Built with purpose by the FinCosmos Club at RNS Institute of Technology. Designed to give students clear, judgment-free visibility into their digital spending and money rhythm.
            </p>
            <div className="text-xs text-slate-500 flex items-center gap-2 pt-1 font-mono">
              <span>Local-first architecture</span>
              <span>·</span>
              <span>Zero external server telemetry</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={downloadSampleCSVFile}
                  className="hover:text-orange-600 transition-colors text-left"
                >
                  Download Sample CSV
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('privacy')}
                  className="hover:text-orange-600 transition-colors text-left"
                >
                  Privacy & Data Security
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('landing')}
                  className="hover:text-orange-600 transition-colors text-left"
                >
                  How Wrapped Works
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Controls</h4>
            <ul className="space-y-2 text-xs">
              {hasData && onClearData && (
                <li>
                  <button
                    onClick={onClearData}
                    className="text-rose-600 hover:text-rose-700 font-medium transition-colors text-left"
                  >
                    Clear My Data from Browser
                  </button>
                </li>
              )}
              <li className="text-slate-500">
                FinCosmos Student Initiative
              </li>
              <li className="text-slate-500">
                Bangalore, Karnataka
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} FinCosmos Club, RNS Institute of Technology. All rights reserved.</p>
          <p className="text-slate-500 text-center sm:text-right max-w-lg">
            Disclaimer: Educational financial awareness application only. Does not constitute professional financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
};
