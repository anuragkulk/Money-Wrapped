export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  valueDate?: string; // ISO YYYY-MM-DD if available
  description: string;
  merchant: string;
  amount: number; // positive number in rupees (stored with precision)
  debit?: number;
  credit?: number;
  balance?: number;
  refNo?: string;
  type: TransactionType;
  category: string;
  excluded: boolean;
  needsReview?: boolean;
  validationIssues?: string[];
  pageNumber?: number;
  confidence?: number;
  notes?: string;
  raw?: Record<string, string>;
}

export interface SpendingCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  keywords: string[];
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

export interface FinancialPersonality {
  id: string;
  title: string;
  tagline: string;
  badge: string;
  description: string;
  color: string;
  accentBg: string;
  reason: string;
  traits: string[];
}

export interface WrappedMetrics {
  reportingPeriod: {
    start: string;
    end: string;
    monthName: string;
    totalDays: number;
  };
  totalExpenses: number;
  totalIncome: number;
  netCashFlow: number | null;
  hasIncomeData: boolean;
  transactionCount: number;
  dailyAverage: number;
  categoryBreakdown: CategorySummary[];
  topCategory: CategorySummary | null;
  biggestDay: {
    date: string;
    total: number;
    count: number;
    topMerchant: string;
  } | null;
  spendingRhythm: {
    weekdayTotal: number;
    weekendTotal: number;
    weekdayAvg: number;
    weekendAvg: number;
    isWeekendHeavy: boolean;
    peakDayName: string;
    dayDistribution: Array<{ day: string; short: string; total: number; count: number }>;
  };
  mostFrequentMerchant: {
    merchant: string;
    count: number;
    total: number;
    avgTicket: number;
  } | null;
  personality: FinancialPersonality;
  forwardInsight: {
    topCategory: string;
    topCategoryTotal: number;
    percentage: number;
    targetReductionPercent: number;
    monthlySavings: number;
    studentImpact: string;
  };
}

export type StatementColumnMode = 'separate_debit_credit' | 'single_amount_type' | 'signed_amount';

export interface ColumnMapping {
  date: string;
  valueDate?: string;
  description: string;
  refNo?: string;
  amount?: string;
  debit?: string;
  credit?: string;
  type?: string;
  balance?: string;
  category?: string;
  columnMode: StatementColumnMode;
}

export interface RawParseResult {
  headers: string[];
  rows: Record<string, string>[];
  detectedMapping: ColumnMapping;
  validationErrors: string[];
  totalRows: number;
  duplicateRows: number;
  headerLineIndex: number;
  ignoredSummaryRows: number;
  bankHint?: string;
  pageCount?: number;
  fileType?: 'csv' | 'pdf' | 'excel';
}
