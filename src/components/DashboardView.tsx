import React, { useState } from 'react';
import {
  Sparkles,
  UploadCloud,
  Calendar,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Receipt,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Building2,
} from 'lucide-react';
import { WrappedMetrics } from '../types';
import { formatINR, formatReadableDate } from '../utils/calculations';

interface DashboardViewProps {
  metrics: WrappedMetrics;
  onLaunchWrapped: () => void;
  onOpenImport: () => void;
  onNavigateToExplorer: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onLaunchWrapped,
  onOpenImport,
  onNavigateToExplorer,
}) => {
  const [activeCategoryHover, setActiveCategoryHover] = useState<string | null>(null);

  const {
    reportingPeriod,
    totalExpenses,
    totalIncome,
    netCashFlow,
    hasIncomeData,
    transactionCount,
    dailyAverage,
    categoryBreakdown,
    topCategory,
    biggestDay,
    spendingRhythm,
    mostFrequentMerchant,
    personality,
    forwardInsight,
  } = metrics;

  let accumulatedAngle = 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200 bg-[#FFFDF9]">
      {/* Top Banner: Period & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-orange-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your Money Wrapped
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800">
              {reportingPeriod.monthName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-orange-500" />
            <span>
              {formatReadableDate(reportingPeriod.start)} – {formatReadableDate(reportingPeriod.end)}
            </span>
            <span>·</span>
            <span>{reportingPeriod.totalDays} calendar days</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 rounded-xl bg-white border border-orange-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 transition-colors shadow-sm"
          >
            <UploadCloud className="h-4 w-4 text-orange-600" />
            <span>Upload Another</span>
          </button>

          <button
            onClick={onLaunchWrapped}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-orange-300/40 hover:brightness-105 active:scale-95 transition-all"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>Launch Story Wrapped</span>
          </button>
        </div>
      </div>

      {/* Hero Wrapped Highlight Card */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-[#FFF3E8] via-[#FFF9F3] to-[#F0FDF4] p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-800 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span>Decoded Archetype: {personality.title}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {personality.tagline}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {personality.description} {personality.reason}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={onLaunchWrapped}
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-300 hover:bg-orange-500 transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-white" />
              <span>View 8 Story Slides</span>
            </button>
            <button
              onClick={onNavigateToExplorer}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-orange-200 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-orange-50 transition-colors shadow-xs"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <span>Explore Transactions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Spending */}
        <div className="rounded-2xl border border-orange-100 bg-white p-4 space-y-1 shadow-xs hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Spent</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(totalExpenses)}
          </p>
          <p className="text-[11px] text-slate-500">Eligible outlays</p>
        </div>

        {/* Card 2: Total Income */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 space-y-1 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Inflow</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {hasIncomeData ? formatINR(totalIncome) : '—'}
          </p>
          <p className="text-[11px] text-slate-500">
            {hasIncomeData ? 'Allowance / income' : 'No income in file'}
          </p>
        </div>

        {/* Card 3: Net Cash Flow */}
        <div className="rounded-2xl border border-sky-100 bg-white p-4 space-y-1 shadow-xs hover:border-sky-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Net Cash Flow</span>
            <Receipt className="h-4 w-4 text-sky-600" />
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              netCashFlow === null
                ? 'text-slate-400'
                : netCashFlow >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {netCashFlow !== null ? formatINR(netCashFlow) : '—'}
          </p>
          <p className="text-[11px] text-slate-500">
            {netCashFlow !== null
              ? netCashFlow >= 0
                ? 'Net positive surplus'
                : 'Net deficit this period'
              : 'Requires income data'}
          </p>
        </div>

        {/* Card 4: Daily Average */}
        <div className="rounded-2xl border border-amber-100 bg-white p-4 space-y-1 shadow-xs hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Daily Average</span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(dailyAverage)}
          </p>
          <p className="text-[11px] text-slate-500">Across {reportingPeriod.totalDays} days</p>
        </div>

        {/* Card 5: Top Category */}
        <div className="rounded-2xl border border-orange-100 bg-white p-4 space-y-1 shadow-xs hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Top Category</span>
            <Layers className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {topCategory ? topCategory.category : 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {topCategory ? `${topCategory.percentage.toFixed(0)}% of outlays` : '0%'}
          </p>
        </div>

        {/* Card 6: Total Transactions */}
        <div className="rounded-2xl border border-blue-100 bg-white p-4 space-y-1 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Transactions</span>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {transactionCount}
          </p>
          <p className="text-[11px] text-slate-500">Processed rows</p>
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-orange-100 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-slate-900">Spending by Category</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {categoryBreakdown.length} active categories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Donut SVG */}
            <div className="sm:col-span-5 flex justify-center relative">
              <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                <circle
                  cx="90"
                  cy="90"
                  r="65"
                  fill="transparent"
                  stroke="#F8FAFC"
                  strokeWidth="24"
                />
                {categoryBreakdown.map((item) => {
                  const circumference = 2 * Math.PI * 65;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((accumulatedAngle / 360) * circumference);

                  return (
                    <circle
                      key={item.category}
                      cx="90"
                      cy="90"
                      r="65"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={activeCategoryHover === item.category ? 28 : 24}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setActiveCategoryHover(item.category)}
                      onMouseLeave={() => setActiveCategoryHover(null)}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-500 font-mono">Total</span>
                <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                  {formatINR(totalExpenses)}
                </span>
              </div>
            </div>

            {/* Category Legend & Bars */}
            <div className="sm:col-span-7 space-y-2.5">
              {categoryBreakdown.slice(0, 5).map((cat) => (
                <div
                  key={cat.category}
                  onMouseEnter={() => setActiveCategoryHover(cat.category)}
                  onMouseLeave={() => setActiveCategoryHover(null)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    activeCategoryHover === cat.category ? 'bg-orange-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-800 font-medium truncate">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-slate-700">
                      <span>{formatINR(cat.total)}</span>
                      <span className="text-slate-400 font-normal">
                        ({cat.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Merchants & Peak Highlights (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-orange-100 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Top Merchants</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">By visit frequency</span>
          </div>

          <div className="space-y-3">
            {mostFrequentMerchant && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-emerald-800">#1 FREQUENT SPOT</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {mostFrequentMerchant.count} visits
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900">{mostFrequentMerchant.merchant}</p>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 font-mono">
                  <span>Total spent: {formatINR(mostFrequentMerchant.total)}</span>
                  <span>Avg ticket: {formatINR(mostFrequentMerchant.avgTicket)}</span>
                </div>
              </div>
            )}

            {biggestDay && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-amber-800">BIGGEST SPENDING DAY</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatReadableDate(biggestDay.date)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                    {formatINR(biggestDay.total)}
                  </p>
                  <span className="text-xs text-slate-500">{biggestDay.count} transactions</span>
                </div>
                <p className="text-xs text-slate-600 truncate">
                  Primary spot: <span className="text-slate-900 font-medium">{biggestDay.topMerchant}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekday vs Weekend Rhythm + Forward Insight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Rhythm analysis */}
        <div className="md:col-span-6 rounded-3xl border border-orange-100 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-slate-900">Spending Rhythm</h3>
            </div>
            <span className="text-xs font-mono font-medium text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full">
              Peak: {spendingRhythm.peakDayName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1">
              <span className="text-xs text-slate-600">Weekday Average</span>
              <p className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {formatINR(spendingRhythm.weekdayAvg)}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Total: {formatINR(spendingRhythm.weekdayTotal)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
              <span className="text-xs text-slate-600">Weekend Average</span>
              <p className="text-xl font-bold font-mono text-orange-600 tabular-nums">
                {formatINR(spendingRhythm.weekendAvg)}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Total: {formatINR(spendingRhythm.weekendTotal)}
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-600 leading-relaxed">
            {spendingRhythm.isWeekendHeavy ? (
              <span className="text-amber-800 font-medium">
                You spend noticeably more on weekends than regular college weekdays.
              </span>
            ) : (
              <span className="text-sky-800 font-medium">
                Your spending stays steady throughout the week without extreme weekend surges.
              </span>
            )}
          </div>
        </div>

        {/* Actionable Forward Insight */}
        <div className="md:col-span-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">One Insight to Take Forward</h3>
            </div>
            <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {forwardInsight.targetReductionPercent}% Optimization
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">{forwardInsight.topCategory}</strong> accounted for{' '}
            <strong className="text-emerald-700 font-mono">
              {forwardInsight.percentage.toFixed(0)}%
            </strong>{' '}
            ({formatINR(forwardInsight.topCategoryTotal)}) of your recorded eligible spending.
          </p>

          <div className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs text-emerald-700 font-mono font-semibold">POTENTIAL MONTHLY SAVINGS</span>
              <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {formatINR(forwardInsight.monthlySavings)}
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 max-w-[200px]">
              {forwardInsight.studentImpact}
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            *This is an educational scenario calculation, not a guarantee.
          </p>
        </div>
      </div>

      {/* Quick Footnote Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-orange-100 shadow-xs">
        <div className="text-xs text-slate-500">
          <span>Decoded period: </span>
          <span className="font-mono text-slate-800 font-medium">
            {formatReadableDate(reportingPeriod.start)} – {formatReadableDate(reportingPeriod.end)}
          </span>
        </div>

        <button
          onClick={onNavigateToExplorer}
          className="text-xs text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 transition-colors"
        >
          <span>View all {transactionCount} raw transactions</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
