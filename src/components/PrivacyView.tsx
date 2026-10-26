import React from 'react';
import { ShieldCheck, Lock, EyeOff, Award, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PrivacyViewProps {
  onBack: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200 bg-[#FFFDF9]">
      {/* Top back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-8 sm:p-10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Privacy & Data Security
            </h1>
            <p className="text-xs font-mono font-semibold text-emerald-800">
              100% IN-BROWSER EXECUTION · ZERO EXTERNAL TELEMETRY
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
          Money Wrapped was created by students, for students. We believe personal financial data should remain strictly confidential. Your bank statements and UPI exports never leave your browser sandbox.
        </p>
      </div>

      {/* The 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-orange-100 bg-white p-6 space-y-3 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">100% In-Browser Parsing</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            All CSV file reading, string parsing, category tagging, and financial calculations run entirely within your local browser memory using JavaScript.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 space-y-3 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <EyeOff className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Credentials or Logins</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            We never request your bank account credentials, debit card details, UPI PINs, or SMS OTPs. You have full transparency over what data you import.
          </p>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white p-6 space-y-3 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Instant One-Click Purge</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Clicking &quot;Clear My Data&quot; immediately wipes all cached transaction records and generated report state from your browser storage.
          </p>
        </div>
      </div>

      {/* Additional Details & FAQ */}
      <div className="rounded-3xl border border-orange-100 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Privacy Guarantees</h2>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">No Tracking or Ad Cookies:</strong> Money Wrapped does not run third-party advertising scripts, telemetry trackers, or profiling tools.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Privacy-Safe Social Sharing:</strong> When generating social share cards for Instagram or WhatsApp, you can mask exact rupee figures to share only percentages and your personality archetype.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Open & Transparent:</strong> Category rules and merchant cleanups operate through simple, deterministic keyword patterns without sending your records to external AI servers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
