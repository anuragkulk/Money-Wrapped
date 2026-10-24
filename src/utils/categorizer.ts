import { SpendingCategory, TransactionType } from '../types';

export const SPENDING_CATEGORIES: SpendingCategory[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    color: '#ea580c', // rich orange
    icon: 'Utensils',
    keywords: [
      'canteen', 'mess', 'swiggy', 'zomato', 'cafe', 'chai', 'tea', 'coffee',
      'dominos', 'burger', 'mcdonald', 'kfc', 'bakery', 'shawarma', 'maggi',
      'pizza', 'starbucks', 'biryani', 'juice', 'lunch', 'dinner', 'snack',
      'subway', 'darshini', 'dosa', 'samosa', 'roll', 'restaurant', 'eatery'
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries & Quick Commerce',
    color: '#059669', // fresh light/mint green
    icon: 'ShoppingBag',
    keywords: [
      'blinkit', 'zepto', 'instamart', 'supermarket', 'bigbasket', 'dmart',
      'grocery', 'milk', 'provisions', 'reliance smart', 'more retail', 'nature basket'
    ],
  },
  {
    id: 'transport',
    name: 'Transport & Commute',
    color: '#0284c7', // vibrant sky blue
    icon: 'Bus',
    keywords: [
      'metro', 'namma metro', 'bmtc', 'bus', 'uber', 'ola', 'rapido', 'auto',
      'irctc', 'train', 'petrol', 'fuel', 'shell', 'hpcl', 'bpcl', 'toll',
      'ticket', 'flight', 'rail'
    ],
  },
  {
    id: 'education',
    name: 'Education & Academics',
    color: '#d97706', // warm golden yellow/amber
    icon: 'GraduationCap',
    keywords: [
      'xerox', 'print', 'photocopy', 'stationery', 'books', 'sapna', 'college fee',
      'tuition', 'exam', 'course', 'udemy', 'coursera', 'library', 'rnsit',
      'textbook', 'calculator', 'record note', 'journal', 'lab fee', 'seminar'
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping & Lifestyle',
    color: '#f43f5e', // coral peach / warm rose
    icon: 'Shirt',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'zudio', 'decathlon',
      'zara', 'h&m', 'clothes', 'mall', 'store', 'shoes', 'sneakers', 'retail',
      'westside', 'trends', 'lifestyle', 'electronics'
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment & OTT',
    color: '#4f46e5', // cobalt/indigo blue
    icon: 'Film',
    keywords: [
      'netflix', 'spotify', 'youtube', 'prime video', 'hotstar', 'bookmyshow',
      'cinema', 'pvr', 'inox', 'movie', 'gaming', 'steam', 'discord', 'event',
      'concert', 'standup', 'playstation'
    ],
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    color: '#0891b2', // bright ocean blue
    icon: 'Receipt',
    keywords: [
      'jio', 'airtel', 'vi', 'vodafone', 'recharge', 'broadband', 'wifi',
      'bescom', 'electricity', 'water', 'cylinder', 'gas', 'postpaid', 'bill desk'
    ],
  },
  {
    id: 'health',
    name: 'Health & Personal Care',
    color: '#10b981', // light mint green
    icon: 'HeartPulse',
    keywords: [
      'apollo', '1mg', 'pharmeasy', 'pharmacy', 'clinic', 'doctor', 'hospital',
      'medicine', 'gym', 'cult.fit', 'fitness', 'salon', 'haircut', 'parlour',
      'spa', 'nykaa', 'grooming', 'medplus'
    ],
  },
  {
    id: 'transfers',
    name: 'Transfers & Self',
    color: '#78716c', // warm stone
    icon: 'ArrowLeftRight',
    keywords: [
      'transfer to', 'sent to', 'upi transfer', 'self transfer', 'to account',
      'imps transfer', 'neft', 'fund transfer', 'gpay send', 'phonepe send'
    ],
  },
  {
    id: 'income',
    name: 'Income & Allowance',
    color: '#16a34a', // bright green
    icon: 'Wallet',
    keywords: [
      'allowance', 'pocket money', 'salary', 'stipend', 'received from',
      'cashback', 'interest', 'refund', 'credit interest', 'dividend', 'deposit'
    ],
  },
  {
    id: 'other',
    name: 'Other & Miscellaneous',
    color: '#94a3b8',
    icon: 'CircleEllipsis',
    keywords: [],
  },
];

/**
 * Normalizes raw merchant strings into clean, human-readable labels.
 * E.g., "UPI/4291823/SWIGGY/BANGALORE" -> "Swiggy"
 */
export function normalizeMerchant(rawDesc: string): string {
  if (!rawDesc) return 'Unknown Merchant';
  const clean = rawDesc.trim();

  // Common Indian UPI and POS patterns
  const lower = clean.toLowerCase();

  if (lower.includes('canteen') || lower.includes('rnsit canteen')) return 'College Canteen';
  if (lower.includes('xerox') || lower.includes('print')) return 'College Xerox & Stationery';
  if (lower.includes('namma metro') || lower.includes('metro')) return 'Namma Metro';
  if (lower.includes('swiggy')) return 'Swiggy';
  if (lower.includes('zomato')) return 'Zomato';
  if (lower.includes('zepto')) return 'Zepto';
  if (lower.includes('blinkit')) return 'Blinkit';
  if (lower.includes('instamart')) return 'Instamart';
  if (lower.includes('rapido')) return 'Rapido';
  if (lower.includes('uber')) return 'Uber';
  if (lower.includes('ola')) return 'Ola';
  if (lower.includes('bmtc')) return 'BMTC Bus';
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('flipkart')) return 'Flipkart';
  if (lower.includes('myntra')) return 'Myntra';
  if (lower.includes('zudio')) return 'Zudio';
  if (lower.includes('decathlon')) return 'Decathlon';
  if (lower.includes('chai') || lower.includes('tea point')) return 'Chai Point / Tea Stall';
  if (lower.includes('spotify')) return 'Spotify';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('pvr') || lower.includes('inox') || lower.includes('bookmyshow')) return 'Cinema (PVR/Inox)';
  if (lower.includes('airtel')) return 'Airtel';
  if (lower.includes('jio')) return 'Jio';
  if (lower.includes('apollo')) return 'Apollo Pharmacy';
  if (lower.includes('allowance') || lower.includes('pocket money') || lower.includes('parents')) return 'Parents Allowance';

  // Strip common bank prefixes like "UPI-", "POS ", "NEFT-", "IMPS-"
  let formatted = clean
    .replace(/^(UPI\/[0-9]+\/|UPI-|POS\s+|NEFT-|IMPS-|BBPS\/)/i, '')
    .replace(/\/[A-Z0-9_-]+$/i, '')
    .replace(/[0-9]{6,}/g, '')
    .trim();

  // If description has commas or dashes, pick first meaningful token
  if (formatted.includes('-')) {
    formatted = formatted.split('-')[0].trim();
  }
  if (formatted.includes('/')) {
    formatted = formatted.split('/')[0].trim();
  }

  // Capitalize neatly
  if (formatted.length > 25) {
    formatted = formatted.slice(0, 25) + '...';
  }

  return formatted || clean;
}

/**
 * Suggests a spending category based on description and merchant keywords.
 */
export function suggestCategory(description: string, typeHint?: TransactionType): string {
  const text = description.toLowerCase();

  // If explicit income hint
  if (typeHint === 'income') {
    return 'Income & Allowance';
  }

  // Check categories sequentially
  for (const cat of SPENDING_CATEGORIES) {
    if (cat.id === 'other') continue;
    for (const kw of cat.keywords) {
      if (text.includes(kw)) {
        return cat.name;
      }
    }
  }

  return 'Other & Miscellaneous';
}

/**
 * Detects if a transaction is likely an Income, Transfer, or Expense.
 */
export function inferTransactionType(
  rawType: string = '',
  amount: number = 0,
  description: string = ''
): TransactionType {
  const text = (rawType + ' ' + description).toLowerCase();

  if (
    text.includes('credit') ||
    text.includes('cr') ||
    text.includes('salary') ||
    text.includes('stipend') ||
    text.includes('allowance') ||
    text.includes('received from') ||
    text.includes('cashback') ||
    text.includes('interest') ||
    text.includes('deposit') ||
    rawType.toLowerCase() === 'income'
  ) {
    return 'income';
  }

  if (
    text.includes('self transfer') ||
    text.includes('transferred to self') ||
    text.includes('own account') ||
    text.includes('sweep')
  ) {
    return 'transfer';
  }

  // Positive vs negative amount conventions
  // If amount explicitly negative in some statements, it's debit/expense.
  // We handle amount sign normalization in parser.
  return 'expense';
}
