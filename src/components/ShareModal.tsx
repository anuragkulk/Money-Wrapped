import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { WrappedMetrics } from '../types';
import { formatINR } from '../utils/calculations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: WrappedMetrics;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  const [hideExactRupees, setHideExactRupees] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const {
    reportingPeriod,
    totalExpenses,
    topCategory,
    categoryBreakdown,
    personality,
    mostFrequentMerchant,
  } = metrics;

  const shareText = `🚀 My FinCosmos Money Wrapped (${reportingPeriod.monthName} 2026):
✨ Archetype: ${personality.title} ("${personality.tagline}")
🍔 Top Outflow: ${topCategory ? `${topCategory.category} (${topCategory.percentage.toFixed(0)}%)` : 'N/A'}
📍 Top Spot: ${mostFrequentMerchant ? mostFrequentMerchant.merchant : 'Campus Canteen'}
${hideExactRupees ? '🔒 Total: [Private]' : `💰 Total Spent: ${formatINR(totalExpenses)}`}

Uncover your money story at FinCosmos Money Wrapped!`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FinCosmos Money Wrapped — ${personality.title}`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadImage = () => {
    setIsGenerating(true);
    // Draw high-resolution light card on HTML5 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    // Warm cream background
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, 1080, 1350);

    // Warm peach and light green ambient gradient blobs
    const grad1 = ctx.createRadialGradient(250, 250, 50, 250, 250, 600);
    grad1.addColorStop(0, 'rgba(254, 215, 170, 0.45)'); // peach
    grad1.addColorStop(1, 'rgba(255, 253, 249, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, 1080, 1350);

    const grad2 = ctx.createRadialGradient(850, 900, 50, 850, 900, 500);
    grad2.addColorStop(0, 'rgba(167, 243, 208, 0.35)'); // light green
    grad2.addColorStop(1, 'rgba(255, 253, 249, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, 1080, 1350);

    // Border
    ctx.strokeStyle = '#FED7AA';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Brand Header
    ctx.fillStyle = '#EA580C';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('FINCOSMOS · RNSIT', 80, 120);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('MONEY WRAPPED', 80, 190);

    ctx.fillStyle = '#64748B';
    ctx.font = '32px monospace';
    ctx.fillText(`${reportingPeriod.monthName} 2026`, 80, 240);

    // Personality Badge Box
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FDBA74';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(80, 300, 920, 260, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = personality.color;
    ctx.font = 'bold 28px monospace';
    ctx.fillText('DECODED ARCHETYPE', 120, 360);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(personality.title, 120, 440);

    ctx.fillStyle = '#475569';
    ctx.font = '32px sans-serif';
    ctx.fillText(personality.tagline, 120, 500);

    // Top Stats Grid
    // Box 1: Total Spent
    ctx.fillStyle = '#FFF7ED';
    ctx.strokeStyle = '#FED7AA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 590, 445, 200, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9A3412';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('TOTAL RECORDED', 110, 640);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 48px monospace';
    ctx.fillText(hideExactRupees ? '₹ •••••' : formatINR(totalExpenses), 110, 715);

    // Box 2: Top Category
    ctx.fillStyle = '#ECFDF5';
    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(555, 590, 445, 200, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('TOP CATEGORY', 585, 640);

    ctx.fillStyle = '#047857';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(topCategory ? topCategory.category : 'N/A', 585, 715);

    // Categories breakdown list
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Spending Breakdown', 80, 850);

    let startY = 910;
    categoryBreakdown.slice(0, 3).forEach((cat) => {
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(cat.category, 80, startY);

      const statText = hideExactRupees
        ? `${cat.percentage.toFixed(0)}%`
        : `${formatINR(cat.total)} (${cat.percentage.toFixed(0)}%)`;

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(statText, 980 - ctx.measureText(statText).width, startY);

      startY += 55;
    });

    // Footer
    ctx.fillStyle = '#64748B';
    ctx.font = '24px monospace';
    ctx.fillText('Processed 100% locally in browser · FinCosmos Club', 80, 1220);

    // Trigger download
    const link = document.createElement('a');
    link.download = `fincosmos_wrapped_${reportingPeriod.monthName.toLowerCase()}_2026.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl text-slate-900 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">Share Your Money Wrapped</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1 rounded-xl hover:bg-orange-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Privacy Masking Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100">
          <div className="flex items-center gap-2.5">
            {hideExactRupees ? (
              <EyeOff className="h-4 w-4 text-amber-600" />
            ) : (
              <Eye className="h-4 w-4 text-emerald-600" />
            )}
            <div>
              <p className="text-xs font-bold text-slate-900">
                {hideExactRupees ? 'Hide Exact Rupee Figures' : 'Show Rupee Amounts'}
              </p>
              <p className="text-[11px] text-slate-600">
                {hideExactRupees
                  ? 'Shares category percentages & archetype only.'
                  : 'Displays your total spending amount.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setHideExactRupees((h) => !h)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              hideExactRupees
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-white text-slate-700 border border-orange-200 hover:bg-orange-50'
            }`}
          >
            {hideExactRupees ? 'Amounts Hidden' : 'Hide Amounts'}
          </button>
        </div>

        {/* Visual Share Card Preview */}
        <div
          ref={cardRef}
          className="rounded-3xl border border-orange-200 bg-gradient-to-br from-[#FFF7ED] via-white to-[#F0FDF4] p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-500 to-emerald-500 flex items-center justify-center font-bold text-white text-xs">
                FC
              </div>
              <span className="text-xs font-bold tracking-tight text-slate-900">FINCOSMOS</span>
              <span className="text-[10px] text-slate-500 font-mono">· RNSIT</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-orange-600">{reportingPeriod.monthName} 2026</span>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-4 space-y-2 shadow-xs">
            <span
              className="text-[10px] font-mono font-semibold uppercase tracking-widest"
              style={{ color: personality.color }}
            >
              MY FINANCIAL ARCHETYPE
            </span>
            <p className="text-2xl font-black text-slate-900">{personality.title}</p>
            <p className="text-xs text-slate-600">{personality.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100">
              <span className="text-slate-500 text-[10px] font-medium">TOTAL OUTFLOW</span>
              <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {hideExactRupees ? '₹ •••••' : formatINR(totalExpenses)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-slate-500 text-[10px] font-medium">TOP CATEGORY</span>
              <p className="text-base font-bold text-emerald-700 truncate">
                {topCategory ? topCategory.category : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-500 transition-colors shadow-md shadow-orange-300/40"
            >
              <Download className="h-4 w-4" />
              <span>{isGenerating ? 'Rendering...' : 'Download Image'}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-slate-800 text-xs font-semibold hover:bg-orange-50 transition-colors border border-orange-200 shadow-xs"
            >
              <Share2 className="h-4 w-4 text-orange-600" />
              <span>Share Card</span>
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-50/60 text-slate-700 text-xs font-semibold hover:bg-orange-100 transition-colors border border-orange-100"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied Summary to Clipboard!' : 'Copy Text Summary'}</span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>No personal names, bank accounts, or UPI IDs are ever shared.</span>
        </div>
      </div>
    </div>
  );
};
