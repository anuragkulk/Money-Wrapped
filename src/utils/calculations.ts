import { CategorySummary, FinancialPersonality, Transaction, WrappedMetrics } from '../types';
import { SPENDING_CATEGORIES } from './categorizer';

/**
 * Formats a numeric value into standard Indian Rupee notation (₹1,25,000 / ₹3,450).
 */
export function formatINR(val: number, options: { decimals?: boolean; hideSymbol?: boolean } = {}): string {
  const { decimals = false, hideSymbol = false } = options;
  if (isNaN(val)) return hideSymbol ? '0' : '₹0';

  const isNeg = val < 0;
  const absVal = Math.abs(val);

  // Split integer and decimal parts
  const fixed = absVal.toFixed(decimals ? 2 : 0);
  const parts = fixed.split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian number grouping: last 3 digits, then groups of 2 digits
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const symbol = hideSymbol ? '' : '₹';
  const prefix = isNeg ? '-' : '';
  const decimalStr = decimals && decPart ? `.${decPart}` : '';

  return `${prefix}${symbol}${formattedInt}${decimalStr}`;
}

/**
 * Formats standard date "2026-10-15" to readable format "15 Oct 2026"
 */
export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(parseInt(year, 10), month, day);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return dateStr;
}

/**
 * Determines financial personality based on transparent, rules-based logic.
 */
export function deriveFinancialPersonality(
  categorySummaries: CategorySummary[],
  totalExpenses: number,
  weekendRatio: number,
  quickCommerceShare: number,
  txCount: number
): FinancialPersonality {
  if (txCount < 4 || totalExpenses <= 0) {
    return {
      id: 'enigma',
      title: 'The Enigma',
      tagline: 'Your money personality is still a mystery.',
      badge: 'Uncharted',
      description: 'You have only imported a few transactions. Import a full month to decode your financial style.',
      color: '#94a3b8',
      accentBg: 'rgba(148, 163, 184, 0.15)',
      reason: 'Fewer than 4 transactions recorded in the reporting period.',
      traits: ['Fresh Explorer', 'Low Sample Count', 'Curious Starter'],
    };
  }

  const catMap = new Map(categorySummaries.map((c) => [c.category, c.percentage]));
  const foodShare = (catMap.get('Food & Dining') || 0) + (catMap.get('Groceries & Quick Commerce') || 0);
  const shoppingShare = catMap.get('Shopping & Lifestyle') || 0;
  const transportShare = catMap.get('Transport & Commute') || 0;
  const entertainmentShare = catMap.get('Entertainment & OTT') || 0;
  const educationShare = catMap.get('Education & Academics') || 0;

  // 1. The Foodie
  if (foodShare >= 40) {
    return {
      id: 'foodie',
      title: 'The Foodie',
      tagline: 'Fueled by canteen chai, Swiggy bites and late-night cravings.',
      badge: 'Gourmet Student',
      description: 'A significant portion of your spending goes toward meals, snacks, and hangouts with friends. Food is your primary life fuel.',
      color: '#ea580c', // rich orange
      accentBg: 'rgba(234, 88, 12, 0.12)',
      reason: `Food & Dining accounted for ${foodShare.toFixed(0)}% of your total spending.`,
      traits: ['Canteen Connoisseur', 'Midnight Muncher', 'Social Feaster'],
    };
  }

  // 2. The Weekend Spender
  if (weekendRatio >= 1.6) {
    return {
      id: 'weekend_spender',
      title: 'The Weekend Dynamo',
      tagline: 'Mon-Fri frugality meets Saturday-Sunday fun.',
      badge: 'Weekend Hero',
      description: 'Your spending surges heavily on Saturday and Sunday compared to quiet college weekdays.',
      color: '#d97706', // warm golden yellow
      accentBg: 'rgba(217, 119, 6, 0.12)',
      reason: `Daily spending on weekends was ${(weekendRatio).toFixed(1)}x higher than weekdays.`,
      traits: ['Weekday Disciplined', 'Weekend Explorer', 'Social Planner'],
    };
  }

  // 3. The Convenience Seeker
  if (quickCommerceShare >= 30) {
    return {
      id: 'convenience_seeker',
      title: 'The Convenience Seeker',
      tagline: 'Why wait when it can be delivered in 10 minutes?',
      badge: 'Speed Demon',
      description: 'Quick-commerce and ride-hailing save you time between lectures, labs, and assignments.',
      color: '#059669', // fresh mint green
      accentBg: 'rgba(5, 150, 105, 0.12)',
      reason: `Instant delivery and on-demand mobility made up ${quickCommerceShare.toFixed(0)}% of your outflows.`,
      traits: ['Time Optimizer', 'App-First Native', 'Fast Mover'],
    };
  }

  // 4. The Academic Hustler
  if (educationShare >= 20) {
    return {
      id: 'academic_hustler',
      title: 'The Academic Hustler',
      tagline: 'Investing in notes, courses, books and future mastery.',
      badge: 'Scholar',
      description: 'You prioritize course materials, certifications, stationery, and academic equipment above frivolous splurges.',
      color: '#0284c7', // vibrant sky blue
      accentBg: 'rgba(2, 132, 199, 0.12)',
      reason: `Education & Academics took ${educationShare.toFixed(0)}% of your recorded expenses.`,
      traits: ['Skill Investor', 'Stationery Hoarder', 'Exam Ready'],
    };
  }

  // 5. The Lifestyle Curator
  if (shoppingShare + entertainmentShare >= 35) {
    return {
      id: 'lifestyle_curator',
      title: 'The Lifestyle Curator',
      tagline: 'Curating the right fits, streams, and aesthetics.',
      badge: 'Trendsetter',
      description: 'You enjoy expressing yourself through lifestyle shopping, tech accessories, and great entertainment.',
      color: '#f43f5e', // peach / coral
      accentBg: 'rgba(244, 63, 94, 0.12)',
      reason: `Shopping and entertainment accounted for ${(shoppingShare + entertainmentShare).toFixed(0)}% of spending.`,
      traits: ['Style Conscious', 'Aesthetic Focused', 'Experience Hunter'],
    };
  }

  // 6. The Balanced Spender (default balanced profile)
  return {
    id: 'balanced_spender',
    title: 'The Balanced Navigator',
    tagline: 'Smooth, steady, and diversified across all fronts.',
    badge: 'Zen Balancer',
    description: 'You keep your funds evenly distributed across food, travel, and college essentials without letting any single category run wild.',
    color: '#0d9488', // ocean teal/light blue
    accentBg: 'rgba(13, 148, 136, 0.12)',
    reason: 'Evenly distributed budget with no single category dominating excessively.',
    traits: ['Pragmatic Thinker', 'Budget Aware', 'Level-Headed'],
  };
}

/**
 * Computes all Money Wrapped statistics from transactions.
 */
export function computeWrappedMetrics(transactions: Transaction[]): WrappedMetrics {
  // Only eligible non-excluded transactions
  const activeTx = transactions.filter((t) => !t.excluded);

  const expenses = activeTx.filter((t) => t.type === 'expense');
  const incomes = activeTx.filter((t) => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const hasIncomeData = incomes.length > 0;
  const netCashFlow = hasIncomeData ? totalIncome - totalExpenses : null;

  // Reporting period
  let start = '';
  let end = '';
  let monthName = 'Recent Period';
  let totalDays = 30;

  if (activeTx.length > 0) {
    const dates = activeTx.map((t) => t.date).filter(Boolean).sort();
    if (dates.length > 0) {
      start = dates[0];
      end = dates[dates.length - 1];

      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      totalDays = Math.max(diffDays, 1);

      // Month name from majority or end date
      monthName = endDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
  }

  // Daily average
  const dailyAverage = totalExpenses > 0 ? Math.round(totalExpenses / totalDays) : 0;

  // Category breakdown
  const catSums: Record<string, { total: number; count: number; color: string }> = {};
  expenses.forEach((t) => {
    const cat = t.category || 'Other & Miscellaneous';
    if (!catSums[cat]) {
      const def = SPENDING_CATEGORIES.find((c) => c.name === cat);
      catSums[cat] = { total: 0, count: 0, color: def ? def.color : '#94a3b8' };
    }
    catSums[cat].total += t.amount;
    catSums[cat].count += 1;
  });

  const categoryBreakdown: CategorySummary[] = Object.entries(catSums)
    .map(([category, val]) => ({
      category,
      total: val.total,
      count: val.count,
      percentage: totalExpenses > 0 ? (val.total / totalExpenses) * 100 : 0,
      color: val.color,
    }))
    .sort((a, b) => b.total - a.total);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Biggest spending day
  const daySums: Record<string, { total: number; count: number; merchants: Record<string, number> }> = {};
  expenses.forEach((t) => {
    if (!daySums[t.date]) {
      daySums[t.date] = { total: 0, count: 0, merchants: {} };
    }
    daySums[t.date].total += t.amount;
    daySums[t.date].count += 1;
    daySums[t.date].merchants[t.merchant] = (daySums[t.date].merchants[t.merchant] || 0) + t.amount;
  });

  let biggestDay: WrappedMetrics['biggestDay'] = null;
  const sortedDays = Object.entries(daySums).sort((a, b) => b[1].total - a[1].total);
  if (sortedDays.length > 0 && sortedDays[0][1].total > 0) {
    const [date, info] = sortedDays[0];
    const topMerchant = Object.entries(info.merchants).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Multiple places';
    biggestDay = {
      date,
      total: info.total,
      count: info.count,
      topMerchant,
    };
  }

  // Spending rhythm: Weekday vs Weekend & Day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayBuckets = dayNames.map((day, idx) => ({
    day,
    short: shortDays[idx],
    total: 0,
    count: 0,
  }));

  let weekdayTotal = 0;
  let weekendTotal = 0;
  let weekdayTxCount = 0;
  let weekendTxCount = 0;

  expenses.forEach((t) => {
    const d = new Date(t.date);
    if (!isNaN(d.getTime())) {
      const dayIdx = d.getDay(); // 0 is Sunday, 6 is Saturday
      dayBuckets[dayIdx].total += t.amount;
      dayBuckets[dayIdx].count += 1;

      if (dayIdx === 0 || dayIdx === 6) {
        weekendTotal += t.amount;
        weekendTxCount += 1;
      } else {
        weekdayTotal += t.amount;
        weekdayTxCount += 1;
      }
    }
  });

  // Calculate distinct calendar days for weekdays and weekends in period
  let weekdayCalendarDays = 0;
  let weekendCalendarDays = 0;
  if (start && end) {
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
      const dIdx = cur.getDay();
      if (dIdx === 0 || dIdx === 6) weekendCalendarDays++;
      else weekdayCalendarDays++;
      cur.setDate(cur.getDate() + 1);
    }
  }

  const weekdayAvg = weekdayCalendarDays > 0 ? Math.round(weekdayTotal / weekdayCalendarDays) : 0;
  const weekendAvg = weekendCalendarDays > 0 ? Math.round(weekendTotal / weekendCalendarDays) : 0;
  const isWeekendHeavy = weekdayAvg > 0 ? weekendAvg > weekdayAvg * 1.3 : weekendTotal > weekdayTotal;

  // Peak day of week
  const peakDayObj = [...dayBuckets].sort((a, b) => b.total - a.total)[0];
  const peakDayName = peakDayObj ? peakDayObj.day : 'Saturday';

  // Most frequent merchant
  const merchantCounts: Record<string, { count: number; total: number }> = {};
  expenses.forEach((t) => {
    const m = t.merchant || 'Unknown';
    if (!merchantCounts[m]) {
      merchantCounts[m] = { count: 0, total: 0 };
    }
    merchantCounts[m].count += 1;
    merchantCounts[m].total += t.amount;
  });

  let mostFrequentMerchant: WrappedMetrics['mostFrequentMerchant'] = null;
  const sortedMerchants = Object.entries(merchantCounts).sort((a, b) => b[1].count - a[1].count);
  if (sortedMerchants.length > 0) {
    const [name, data] = sortedMerchants[0];
    mostFrequentMerchant = {
      merchant: name,
      count: data.count,
      total: data.total,
      avgTicket: Math.round(data.total / data.count),
    };
  }

  // Quick commerce & delivery share calculation
  const quickCommerceKeywords = ['swiggy', 'zomato', 'zepto', 'blinkit', 'instamart', 'rapido', 'uber', 'ola'];
  const quickCommerceTotal = expenses
    .filter((t) => quickCommerceKeywords.some((kw) => (t.merchant + ' ' + t.description).toLowerCase().includes(kw)))
    .reduce((sum, t) => sum + t.amount, 0);
  const quickCommerceShare = totalExpenses > 0 ? (quickCommerceTotal / totalExpenses) * 100 : 0;

  // Derive personality
  const weekendRatio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 1;
  const personality = deriveFinancialPersonality(
    categoryBreakdown,
    totalExpenses,
    weekendRatio,
    quickCommerceShare,
    expenses.length
  );

  // Forward actionable insight: 10% reduction on top flexible category
  const targetCategory = topCategory ? topCategory.category : 'Food & Dining';
  const targetCatTotal = topCategory ? topCategory.total : 0;
  const targetPercent = 10;
  const monthlySavings = Math.round((targetCatTotal * targetPercent) / 100);

  let studentImpact = 'gives you a comfortable buffer for unexpected college expenses.';
  if (monthlySavings >= 600) {
    studentImpact = 'could fully cover 2 months of Namma Metro or bus commutes.';
  } else if (monthlySavings >= 300) {
    studentImpact = 'covers your entire semester photocopying, notes, and lab manual printing.';
  } else if (monthlySavings >= 150) {
    studentImpact = 'buys 3 weeks of morning college canteen filter coffee and snacks.';
  }

  return {
    reportingPeriod: {
      start,
      end,
      monthName,
      totalDays,
    },
    totalExpenses,
    totalIncome,
    netCashFlow,
    hasIncomeData,
    transactionCount: activeTx.length,
    dailyAverage,
    categoryBreakdown,
    topCategory,
    biggestDay,
    spendingRhythm: {
      weekdayTotal,
      weekendTotal,
      weekdayAvg,
      weekendAvg,
      isWeekendHeavy,
      peakDayName,
      dayDistribution: dayBuckets,
    },
    mostFrequentMerchant,
    personality,
    forwardInsight: {
      topCategory: targetCategory,
      topCategoryTotal: targetCatTotal,
      percentage: topCategory ? topCategory.percentage : 0,
      targetReductionPercent: targetPercent,
      monthlySavings,
      studentImpact,
    },
  };
}
