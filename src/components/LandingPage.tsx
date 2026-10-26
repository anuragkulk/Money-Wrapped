import React from 'react';
import {
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  PieChart,
  Share2,
  Flame,
} from 'lucide-react';
import { formatINR } from '../utils/calculations';
import { downloadSampleCSVFile } from '../utils/csvParser';

interface LandingPageProps {
  onStartImport: () => void;
  onLoadDemo: () => void;
  onLaunchWrapped: () => void;
  hasData: boolean;
  totalExpenses?: number;
  monthName?: string;
  topCategory?: string;
  personalityTitle?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartImport,
  onLoadDemo,
  onLaunchWrapped,
  hasData,
  totalExpenses = 4890,
  monthName = 'October',
  topCategory = 'Food & Dining',
  personalityTitle = 'The Foodie',
}) => {
  return (
    <div className="relative overflow-hidden bg-[#FFFDF9]">
      {/* Background warm radial gradients with orange, peach, yellow, and light green */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60">
        <div className="h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-orange-200/60 via-amber-100/50 to-emerald-100/40 blur-[130px]" />
      </div>
      <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-sky-100/50 blur-[90px]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Top Headline & Import Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-orange-800 bg-orange-100/80 border border-orange-200 px-3 py-1 rounded-full">
              <span>FINCOSMOS · RNSIT STUDENT INITIATIVE</span>
              <span>·</span>
              <span>100% PRIVATE & IN-BROWSER</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] text-balance">
              Ready to decode your month?{' '}
              <span className="block mt-1 bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-600 bg-clip-text text-transparent">
                Your money has a story.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Join hundreds of students uncovering their financial habits in a fun, judgment-free format.
            </p>

            {/* Prominent Action Bar at the top so students upload first */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {hasData ? (
                <>
                  <button
                    onClick={onLaunchWrapped}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-300/40 transition-all hover:brightness-105 active:scale-98 whitespace-nowrap"
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                    <span>Open My Money Wrapped</span>
                  </button>
                  <button
                    onClick={onStartImport}
                    className="flex items-center gap-2 rounded-xl bg-white border border-orange-200 px-5 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-orange-50 hover:border-orange-300 whitespace-nowrap"
                  >
                    <UploadCloud className="h-4 w-4 text-orange-600" />
                    <span>Import Another Statement</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onStartImport}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-300/40 transition-all hover:bg-orange-500 active:scale-98 whitespace-nowrap"
                  >
                    <UploadCloud className="h-4 w-4 text-white" />
                    <span>Import My Transactions</span>
                  </button>

                  <button
                    onClick={onLoadDemo}
                    className="flex items-center gap-2 rounded-xl bg-white border border-orange-200 px-5 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-orange-50 hover:border-orange-300 whitespace-nowrap"
                  >
                    <span>Explore Demo Data</span>
                  </button>
                </>
              )}

              <button
                onClick={downloadSampleCSVFile}
                className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 transition-colors py-2 px-1"
              >
                Download Sample CSV
              </button>
            </div>

            {/* Quick Proof Strip */}
            <div className="pt-6 border-t border-orange-100 grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-xl font-bold font-mono text-orange-600 tabular-nums">0</p>
                <p className="text-xs text-slate-500">External server uploads</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-emerald-600 tabular-nums">8</p>
                <p className="text-xs text-slate-500">Story report slides</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-sky-600 tabular-nums">₹0</p>
                <p className="text-xs text-slate-500">100% Free & open</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Mockup / Story Card Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl border border-orange-200/80 bg-white p-5 shadow-xl shadow-orange-100 overflow-hidden">
              {/* Demo Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono font-semibold text-slate-700">DEMO WRAPPED REPORT</span>
                </div>
                <span className="text-xs text-orange-600 font-mono font-medium">{monthName} 2026</span>
              </div>

              {/* Card visual backdrop with bright light hero asset */}
              <div className="relative my-4 h-48 w-full rounded-2xl overflow-hidden border border-orange-100 bg-orange-50/50">
                <img
                  src="/src/assets/images/fincosmos_light_hero_1792766430709.jpg"
                  alt="FinCosmos Financial Story Illustration"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-orange-700 font-semibold uppercase">TOP SPOT</span>
                    <p className="text-sm font-bold text-slate-900">College Canteen</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">TOTAL RECORDED</span>
                    <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                      {formatINR(totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Story Highlights Preview */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                    <span className="text-slate-700 font-medium">Financial Archetype</span>
                  </div>
                  <span className="font-semibold text-orange-700">{personalityTitle}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-700 font-medium">Primary Outflow</span>
                  </div>
                  <span className="font-semibold text-emerald-700">{topCategory}</span>
                </div>
              </div>

              {/* Interactive CTA to test report */}
              <div className="mt-5 pt-3 border-t border-orange-100">
                <button
                  onClick={hasData ? onLaunchWrapped : onLoadDemo}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold hover:brightness-105 transition-all shadow-sm shadow-orange-300/40"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Preview Full Interactive Story</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="border-t border-orange-100 bg-[#FFF9F3] py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-mono font-semibold text-orange-600 uppercase tracking-wider">
              Simple 4-Step Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              From statement to story in seconds
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              No account creation, no password storage, and no complicated accounting spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-orange-200/70 bg-white p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">1. Import Transactions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your monthly bank or UPI statement CSV. Auto-detection identifies dates, amounts, and descriptions.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-white p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <PieChart className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">2. Categorize & Review</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Campus-tailored rules categorize canteen, travel, Xerox, and shopping. Easily exclude transfers or edit rows.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-white p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">3. Decode Your Story</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Step through 8 Spotify Wrapped-style slides revealing your peak spending days, daily averages, and financial personality.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200/70 bg-white p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">4. Share or Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate high-resolution share cards for Instagram stories or WhatsApp, with built-in privacy masking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
