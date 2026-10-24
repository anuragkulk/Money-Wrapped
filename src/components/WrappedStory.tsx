import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
  Calendar,
  Layers,
  Building2,
  Clock,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { WrappedMetrics } from '../types';
import { formatINR, formatReadableDate } from '../utils/calculations';

interface WrappedStoryProps {
  metrics: WrappedMetrics;
  onClose: () => void;
  onOpenShare: () => void;
}

export const WrappedStory: React.FC<WrappedStoryProps> = ({
  metrics,
  onClose,
  onOpenShare,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [progress, setProgress] = useState(0);

  const touchStartX = useRef<number>(0);
  const totalSlides = 8;
  const slideDuration = 6500; // 6.5s per slide

  const {
    reportingPeriod,
    totalExpenses,
    totalIncome,
    hasIncomeData,
    transactionCount,
    dailyAverage,
    categoryBreakdown,
    biggestDay,
    spendingRhythm,
    mostFrequentMerchant,
    personality,
    forwardInsight,
  } = metrics;

  // Gentle synthesizer sound effect using Web Audio API
  const playSoundEffect = (frequency = 440) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not supported
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, isPaused]);

  useEffect(() => {
    if (isPaused) return;

    setProgress(0);
    const intervalTime = 50;
    const step = (intervalTime / slideDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentSlide, isPaused]);

  const goToNext = () => {
    playSoundEffect(587.33); // D5
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((c) => c + 1);
      setProgress(0);
    } else {
      setIsPaused(true);
    }
  };

  const goToPrev = () => {
    playSoundEffect(440); // A4
    if (currentSlide > 0) {
      setCurrentSlide((c) => c - 1);
      setProgress(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    if (diff < -50) goToNext();
    if (diff > 50) goToPrev();
  };

  // Dynamic light ambient glow based on slide theme
  const getAmbientColor = () => {
    switch (currentSlide) {
      case 0: return '#FED7AA'; // warm peach/orange
      case 1: return '#FEF08A'; // sunny yellow
      case 2: return '#FFEDD5'; // peach
      case 3: return '#BAE6FD'; // sky blue
      case 4: return '#A7F3D0'; // light green
      case 5: return '#FDE68A'; // amber yellow
      case 6: return '#FED7AA'; // peach orange
      case 7: return '#BBF7D0'; // fresh mint
      default: return '#FED7AA';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 text-slate-900 select-none backdrop-blur-md p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background ambient warm pastel glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-70">
        <div
          className="h-[550px] w-[550px] rounded-full blur-[140px] transition-all duration-700"
          style={{ backgroundColor: getAmbientColor() }}
        />
      </div>

      {/* Main Story Container: 9:16 mobile aspect ratio or comfortable vertical card */}
      <div className="relative w-full max-w-md h-[92vh] max-h-[780px] rounded-3xl border border-orange-200/90 bg-[#FFFDF9] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Top Story Progress Bars (8 segments) */}
        <div className="relative z-20 px-5 pt-4 pb-2 space-y-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  setProgress(0);
                }}
                className="h-1 flex-1 bg-orange-100 rounded-full overflow-hidden cursor-pointer"
              >
                <div
                  className="h-full bg-orange-500 transition-all duration-75"
                  style={{
                    width:
                      idx < currentSlide
                        ? '100%'
                        : idx === currentSlide
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Bar Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-wider text-[11px] font-mono">
                MONEY WRAPPED
              </span>
              <span>·</span>
              <span className="text-[11px] font-mono text-orange-600 font-semibold">
                0{currentSlide + 1} / 0{totalSlides}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-orange-50 transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>

              <button
                onClick={() => {
                  setSoundEnabled((s) => !s);
                  playSoundEffect(523.25);
                }}
                className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-orange-50 transition-colors"
                title={soundEnabled ? 'Mute' : 'Enable Subtle Sound'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-600" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-orange-50 transition-colors"
                title="Exit to Dashboard"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Content Slide Area */}
        <div className="relative flex-1 px-6 py-4 flex flex-col justify-center overflow-y-auto">
          {/* Invisible touch navigators */}
          <button
            onClick={goToPrev}
            disabled={currentSlide === 0}
            className="absolute left-0 top-0 bottom-0 w-1/5 z-10 cursor-default opacity-0"
            aria-label="Previous slide"
          />
          <button
            onClick={goToNext}
            className="absolute right-0 top-0 bottom-0 w-1/5 z-10 cursor-default opacity-0"
            aria-label="Next slide"
          />

          {/* SLIDE 1: Month in Money */}
          {currentSlide === 0 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-tr from-orange-400 via-amber-400 to-emerald-400 p-0.5 shadow-md shadow-orange-200 flex items-center justify-center">
                <div className="h-full w-full rounded-3xl bg-white flex items-center justify-center">
                  <Sparkles className="h-9 w-9 text-orange-500" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-orange-600 uppercase tracking-widest">
                  YOUR MONTH IN MONEY
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {reportingPeriod.monthName}, decoded.
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  From {formatReadableDate(reportingPeriod.start)} to {formatReadableDate(reportingPeriod.end)}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-200/80 bg-white p-5 space-y-3 text-left shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Total Eligible Outflows</span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatINR(totalExpenses)}
                  </span>
                </div>
                {hasIncomeData && (
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-orange-100">
                    <span className="text-slate-600">Inflow / Allowances</span>
                    <span className="text-sm font-semibold font-mono text-emerald-600 tabular-nums">
                      {formatINR(totalIncome)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs pt-2 border-t border-orange-100">
                  <span className="text-slate-600">Recorded Transactions</span>
                  <span className="text-sm font-semibold font-mono text-orange-700 tabular-nums">
                    {transactionCount} transactions
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Top Spending Categories */}
          {currentSlide === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1 text-center">
                <span className="text-xs font-mono font-semibold text-amber-700 uppercase tracking-widest">
                  BREAKDOWN
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Where did your money go?
                </h2>
                <p className="text-xs text-slate-500">Your top spending categories this month</p>
              </div>

              <div className="space-y-3 pt-2">
                {categoryBreakdown.slice(0, 4).map((cat, idx) => (
                  <div
                    key={cat.category}
                    className="rounded-2xl border border-orange-100 bg-white p-3.5 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-mono font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900">{cat.category}</span>
                      </div>
                      <div className="font-mono text-slate-800">
                        <span>{formatINR(cat.total)}</span>
                        <span className="text-slate-500 ml-1.5 font-normal">
                          ({cat.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
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
          )}

          {/* SLIDE 3: Biggest Spending Day */}
          {currentSlide === 2 && biggestDay && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                <Calendar className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-amber-700 uppercase tracking-widest">
                  PEAK MOMENT
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Your Biggest Spending Day
                </h2>
                <p className="text-xs text-slate-500">The single 24 hours with highest outlays</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/70 to-white p-6 space-y-3 shadow-xs">
                <span className="text-xs text-amber-800 font-mono font-semibold">
                  {formatReadableDate(biggestDay.date)}
                </span>
                <p className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {formatINR(biggestDay.total)}
                </p>
                <div className="pt-2 border-t border-amber-100 text-xs text-slate-600">
                  <span>{biggestDay.count} transactions recorded</span>
                  <span> · </span>
                  <span className="text-slate-900 font-medium">Main: {biggestDay.topMerchant}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Whether celebrating exams or stocking up on semester essentials, every student has that one standout day.
              </p>
            </div>
          )}

          {/* SLIDE 4: Spending Rhythm */}
          {currentSlide === 3 && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600">
                <Clock className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-sky-700 uppercase tracking-widest">
                  YOUR RHYTHM
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Weekday vs Weekend
                </h2>
                <p className="text-xs text-slate-500">How your spending flows across the week</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 space-y-1">
                  <span className="text-[11px] text-slate-600">Mon – Fri Daily Avg</span>
                  <p className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatINR(spendingRhythm.weekdayAvg)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 space-y-1">
                  <span className="text-[11px] text-slate-600">Sat – Sun Daily Avg</span>
                  <p className="text-xl font-bold font-mono text-orange-600 tabular-nums">
                    {formatINR(spendingRhythm.weekendAvg)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-4 text-xs text-slate-600 leading-relaxed shadow-xs">
                {spendingRhythm.isWeekendHeavy ? (
                  <p>
                    Your weekends bring a noticeable spike in meals, travel, and outings compared to regular college weekdays.
                  </p>
                ) : (
                  <p>
                    You maintain a remarkably balanced routine without explosive weekend spikes.
                  </p>
                )}
                <div className="mt-2 text-[11px] text-orange-700 font-mono font-medium">
                  Peak overall day of the week: {spendingRhythm.peakDayName}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: Most Frequent Merchant */}
          {currentSlide === 4 && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Building2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-emerald-700 uppercase tracking-widest">
                  YOUR GO-TO SPOT
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Most Frequent Spot
                </h2>
                <p className="text-xs text-slate-500">The merchant you visited most often</p>
              </div>

              {mostFrequentMerchant ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-3 shadow-xs">
                  <span className="text-xs text-emerald-800 font-mono font-semibold">CAMPUS FAVORITE</span>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {mostFrequentMerchant.merchant}
                  </p>
                  <div className="pt-2 flex justify-center gap-6 text-xs text-slate-600 font-mono border-t border-emerald-100">
                    <div>
                      <p className="text-slate-500 text-[10px]">TOTAL SWIPES</p>
                      <p className="text-base font-bold text-slate-900">{mostFrequentMerchant.count} times</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px]">TOTAL SPENT</p>
                      <p className="text-base font-bold text-slate-900">{formatINR(mostFrequentMerchant.total)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                  No distinct repeat merchant found.
                </div>
              )}

              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Whether grab-and-go canteen meals or metro card recharges, this is where your UPI logged the most taps.
              </p>
            </div>
          )}

          {/* SLIDE 6: Average Day */}
          {currentSlide === 5 && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                <Layers className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-amber-700 uppercase tracking-widest">
                  DAILY RUN RATE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Your Average Day
                </h2>
                <p className="text-xs text-slate-500">Across {reportingPeriod.totalDays} calendar days</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white p-6 space-y-2 shadow-xs">
                <span className="text-xs text-slate-500 font-mono">DAILY EXPENSE PACE</span>
                <p className="text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {formatINR(dailyAverage)}
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  Total of {formatINR(totalExpenses)} ÷ {reportingPeriod.totalDays} days
                </p>
              </div>

              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Knowing your average daily burn rate makes planning next month's allowance simple and predictable.
              </p>
            </div>
          )}

          {/* SLIDE 7: Financial Personality Archetype */}
          {currentSlide === 6 && (
            <div className="space-y-5 text-center animate-in fade-in duration-300">
              <div
                className="mx-auto h-20 w-20 rounded-3xl p-0.5 shadow-md flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${personality.color}, #F59E0B)`,
                }}
              >
                <div className="h-full w-full rounded-3xl bg-white flex items-center justify-center">
                  <Compass className="h-9 w-9" style={{ color: personality.color }} />
                </div>
              </div>

              <div className="space-y-1">
                <span
                  className="text-xs font-mono font-semibold uppercase tracking-widest"
                  style={{ color: personality.color }}
                >
                  DECODED PERSONALITY
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {personality.title}
                </h2>
                <p className="text-xs text-slate-600 font-medium">{personality.tagline}</p>
              </div>

              <div className="rounded-2xl border border-orange-150 bg-white p-5 space-y-3 text-left shadow-xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {personality.description}
                </p>
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {personality.traits.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-100 font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-mono">
                Rule logic: {personality.reason}
              </p>
            </div>
          )}

          {/* SLIDE 8: One Insight to Take Forward */}
          {currentSlide === 7 && (
            <div className="space-y-5 text-center animate-in fade-in duration-300">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Sparkles className="h-8 w-8 text-amber-500" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-semibold text-emerald-700 uppercase tracking-widest">
                  YOUR TAKEAWAY
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  One Move for Next Month
                </h2>
                <p className="text-xs text-slate-500">A clear, judgment-free observation</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white p-5 space-y-3 text-left shadow-xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">{forwardInsight.topCategory}</strong> accounted for{' '}
                  <strong className="text-emerald-700 font-mono">
                    {forwardInsight.percentage.toFixed(0)}%
                  </strong>{' '}
                  of your recorded expenses ({formatINR(forwardInsight.topCategoryTotal)}).
                </p>
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-mono font-semibold text-emerald-800">
                    A MODEST {forwardInsight.targetReductionPercent}% SHIFT SAVES:
                  </span>
                  <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatINR(forwardInsight.monthlySavings)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {forwardInsight.studentImpact}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={onOpenShare}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-white text-xs font-semibold shadow-md shadow-orange-300 hover:brightness-105 active:scale-95 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share My Money Wrapped</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-orange-200 bg-white text-slate-700 text-xs font-semibold hover:bg-orange-50 transition-colors shadow-xs"
                >
                  View Full Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="relative z-20 px-6 py-4 border-t border-orange-100 flex items-center justify-between text-xs bg-white/50 backdrop-blur-xs">
          <button
            onClick={goToPrev}
            disabled={currentSlide === 0}
            className={`flex items-center gap-1 font-medium transition-colors ${
              currentSlide === 0
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>

          {currentSlide < totalSlides - 1 ? (
            <button
              onClick={goToNext}
              className="flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span>Done</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
