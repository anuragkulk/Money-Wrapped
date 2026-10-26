import { SpendingCategory, TransactionType } from '../types';

export const SPENDING_CATEGORIES: SpendingCategory[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    color: '#ea580c', // rich orange
    icon: 'Utensils',
    keywords: [
      'canteen', 'mess', 'swiggy', 'zomato', 'cafe', 'chai', 'tea', 'coffee',
      'dominos', 'burger', 'mcdonald', 'kfc', 'bakery', 'bake', 'cake', 'corner',
      'shawarma', 'maggi', 'pizza', 'starbucks', 'biryani', 'juice', 'lunch', 'dinner',
      'snack', 'snacks', 'subway', 'darshini', 'dosa', 'samosa', 'roll', 'restaurant',
      'eatery', 'haldiram', 'udupi', 'sweet', 'sweets', 'dhaba', 'chaat', 'chat', 'chats',
      'theobroma', 'baskin', 'hornbill', 'vendx', 'vendx01offline', 'bites', 'kitchen', 'diner'
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries & Quick Commerce',
    color: '#059669', // fresh mint green
    icon: 'ShoppingBag',
    keywords: [
      'blinkit', 'zepto', 'instamart', 'supermarket', 'bigbasket', 'dmart',
      'grocery', 'groceries', 'milk', 'provisions', 'provision', 's r s provision',
      'reliance smart', 'more retail', 'nature basket', 'bbdaily', 'country delight',
      'vegetables', 'fruits', 'essentials', 'lashwik essentials', 'kirana', 'general store', 'mart'
    ],
  },
  {
    id: 'transport',
    name: 'Transport & Commute',
    color: '#0284c7', // vibrant sky blue
    icon: 'Bus',
    keywords: [
      'bmtc', 'bmrcl', 'mybmtcdqr', 'metro', 'namma metro', 'peenya', 'jalahalli',
      'cycle', 'cycle work', 'sri raghavendra cycle', 'bus', 'uber', 'ola', 'rapido', 'auto',
      'irctc', 'train', 'petrol', 'fuel', 'shell', 'hpcl', 'bpcl', 'toll',
      'ticket', 'flight', 'rail', 'fastag', 'parking', 'iocl', 'cab', 'transit'
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
      'westside', 'trends', 'lifestyle', 'electronics', 'croma', 'reliance digital',
      'nykaa fashion', 'snitch', 'bewakoof', 'uniqlo', 'tata cliq'
    ],
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions & Digital Services',
    color: '#8b5cf6', // purple
    icon: 'Sparkles',
    keywords: [
      'spotify', 'netflix', 'youtube premium', 'prime video', 'apple', 'google play',
      'playstore', 'mandateexecute', 'google/playstore', 'icloud', 'chatgpt', 'openai',
      'claude', 'github', 'notion', 'adobe', 'hotstar', 'disney', 'sonyliv', 'zee5',
      'crunchyroll', 'subscrip'
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment & OTT',
    color: '#4f46e5', // cobalt/indigo blue
    icon: 'Film',
    keywords: [
      'bookmyshow', 'cinema', 'pvr', 'inox', 'movie', 'gaming', 'steam', 'discord', 'event',
      'concert', 'standup', 'playstation', 'smaaash', 'bowling', 'arcade', 'ticketnew'
    ],
  },
  {
    id: 'health',
    name: 'Health & Medical',
    color: '#10b981', // light mint green
    icon: 'HeartPulse',
    keywords: [
      'apollo', '1mg', 'pharmeasy', 'pharmacy', 'clinic', 'doctor', 'hospital',
      'medicine', 'medicals', 'medical', 'sri venkateshwara medicals', 'medplus',
      'netmeds', 'lab test', 'dentist', 'diagnostic', 'chemist'
    ],
  },
  {
    id: 'personal_care',
    name: 'Personal Care & Grooming',
    color: '#ec4899', // pink
    icon: 'Smile',
    keywords: [
      'salon', 'haircut', 'parlour', 'spa', 'nykaa', 'grooming', 'gym', 'cult.fit',
      'fitness', 'skincare', 'cosmetics', 'barber', 'beardo', 'man matters'
    ],
  },
  {
    id: 'education',
    name: 'Education & Academics',
    color: '#d97706', // warm golden yellow/amber
    icon: 'GraduationCap',
    keywords: [
      'topmate', 'christ university', 'university', 'college', 'xerox', 'print', 'photocopy', 'stationery', 'books', 'sapna',
      'college fee', 'tuition', 'exam', 'course', 'udemy', 'coursera', 'library',
      'rnsit', 'textbook', 'calculator', 'record note', 'journal', 'lab fee', 'seminar',
      'internshala', 'skillshare', 'edx', 'unacademy', 'physics wallah'
    ],
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    color: '#0891b2', // bright ocean blue
    icon: 'Receipt',
    keywords: [
      'jio', 'airtel', 'vi', 'vodafone', 'recharge', 'broadband', 'wifi', 'act fibernet',
      'bescom', 'electricity', 'water', 'cylinder', 'gas', 'postpaid', 'bill desk',
      'bbps', 'tata power', 'cesc', 'piped gas'
    ],
  },
  {
    id: 'rent',
    name: 'Rent & Housing',
    color: '#eab308', // yellow
    icon: 'Home',
    keywords: [
      'rent', 'hostel', 'pg', 'landlord', 'maintenance', 'deposit', 'flat',
      'room rent', 'house rent', 'stanza living', 'zolo', 'colive'
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Vacation',
    color: '#06b6d4', // cyan
    icon: 'Compass',
    keywords: [
      'makemytrip', 'goibibo', 'easemytrip', 'hotel', 'resort', 'homestay',
      'airbnb', 'oyo', 'indigo', 'air india', 'akasa', 'redbus', 'abhibus'
    ],
  },
  {
    id: 'income',
    name: 'Income & Allowance',
    color: '#16a34a', // bright green
    icon: 'Wallet',
    keywords: [
      'allowance', 'pocket money', 'salary', 'stipend', 'received from',
      'cashback', 'interest', 'credit interest', 'dividend', 'deposit',
      'arun mahadev kulkarni', 'sangeetha kulkarni'
    ],
  },
  {
    id: 'transfers',
    name: 'Transfers & Peer Payments',
    color: '#78716c', // warm stone
    icon: 'ArrowLeftRight',
    keywords: [
      'payment from phonepe', 'phonepe', 'phonep', 'bharatpe', 'pay to bharatpe',
      'transfer to', 'sent to', 'upi transfer', 'self transfer', 'to account',
      'imps transfer', 'neft', 'fund transfer', 'gpay send', 'phonepe send',
      'own a/c', 'trf to', 'tfr to', 'fampay', 'fam', 'fppi', 'peer'
    ],
  },
  {
    id: 'investments',
    name: 'Investments & Mutual Funds',
    color: '#3b82f6', // blue
    icon: 'TrendingUp',
    keywords: [
      'iccl', 'indian clearing corporation', 'groww', 'mutual fund', 'mutual funds',
      'zerodha', 'indmoney', 'upstox', 'angelone', 'sip', 'camsonline', 'kfintech',
      'nps', 'ppf', 'etf', 'gold', 'coinswitch', 'wazirx'
    ],
  },
  {
    id: 'loan_emi',
    name: 'Loan & EMI Payments',
    color: '#b45309', // amber/brown
    icon: 'CreditCard',
    keywords: [
      'emi', 'loan', 'credit card payment', 'cred', 'hdfc cc', 'sbi card',
      'icici cc', 'bajaj finance', 'nach/emi', 'ach debit', 'equated monthly'
    ],
  },
  {
    id: 'banking_fees',
    name: 'Banking Fees & Charges',
    color: '#dc2626', // red
    icon: 'AlertCircle',
    keywords: [
      'annual fee', 'sms charge', 'minimum balance', 'penalty', 'gst charge',
      'atm charge', 'card renewal', 'folio charge', 'service tax'
    ],
  },
  {
    id: 'refunds',
    name: 'Refunds & Reversals',
    color: '#14b8a6', // teal
    icon: 'RotateCcw',
    keywords: [
      'refund', 'reversal', 'reversed', 'cashback', 'rev-upi', 'failed txn refund',
      'chargeback', 'cr rev'
    ],
  },
  {
    id: 'cash_atm',
    name: 'Cash Withdrawal (ATM)',
    color: '#64748b', // slate
    icon: 'Banknote',
    keywords: [
      'atm withdrawal', 'cashnt', 'self-switch', 'at cashnt', 'atm wdl', 'atm cash',
      'cash wdl', 'nfs*atm', 'cash withdrawal', 'atw', 'teller cash'
    ],
  },
  {
    id: 'other',
    name: 'Other & Miscellaneous',
    color: '#94a3b8',
    icon: 'CircleEllipsis',
    keywords: [],
  },
  {
    id: 'needs_review',
    name: 'Needs Review',
    color: '#f97316',
    icon: 'HelpCircle',
    keywords: [],
  },
];

/**
 * Normalizes raw merchant strings into clean, human-readable labels.
 * E.g., "UPI/4291823/SWIGGY/BANGALORE" -> "Swiggy"
 */
export function normalizeMerchant(rawDesc: string): string {
  if (!rawDesc) return 'Unknown Entity';
  const clean = rawDesc.trim();
  const lower = clean.toLowerCase();

  // 1. High-priority known brands & services
  if (lower.includes('bmtc') || lower.includes('mybmtcdqr')) return 'BMTC Bus';
  if (lower.includes('bmrcl peenya')) return 'BMRCL Metro (Peenya)';
  if (lower.includes('bmrcl jalahalli')) return 'BMRCL Metro (Jalahalli)';
  if (lower.includes('bmrcl rajaji nagar') || lower.includes('bmrcl rajajinagar')) return 'BMRCL Metro (Rajajinagar)';
  if (lower.includes('bmrcl national college')) return 'BMRCL Metro (National College)';
  if (lower.includes('bmrcl') || lower.includes('namma metro') || (lower.includes('metro') && !lower.includes('cash and carry'))) return 'Namma Metro (BMRCL)';
  if (lower.includes('renuka cake corner') || lower.includes('renuka cake')) return 'Renuka Cake Corner';
  if (lower.includes('bookmyshow')) return 'BookMyShow';
  if (lower.includes('christ university')) return 'Christ University';
  if (lower.includes('sanndi juice chats') || lower.includes('sanndi juice')) return 'Sanndi Juice & Chats';
  if (lower.includes('burger king')) return 'Burger King';
  if (lower.includes('hornbill foods') || lower.includes('hornbill')) return 'Hornbill Foods';
  if (lower.includes('vendx')) return 'Vendx Smart Kiosk';
  if (lower.includes('spotify')) return 'Spotify';
  if (lower.includes('google play') || lower.includes('playstore')) return 'Google Play';
  if (lower.includes('sri raghavendra cycle')) return 'Sri Raghavendra Cycle Work';
  if (lower.includes('sri venkateshwara medicals')) return 'Sri Venkateshwara Medicals';
  if (lower.includes('s r s provision')) return 'SRS Provision Store';
  if (lower.includes('lashwik essentials')) return 'Lashwik Essentials';
  if (lower.includes('iccl') || lower.includes('groww')) return 'Groww Mutual Funds (ICCL)';
  if (lower.includes('topmate')) return 'Topmate.io';
  if (lower.includes('atm withdrawal') || lower.includes('cashnt') || lower.includes('self-switch')) return 'ATM Cash Withdrawal';
  if (lower.includes('arun mahadev kulkarni')) return 'Arun Mahadev Kulkarni (Parent Allowance)';
  if (lower.includes('sangeetha kulkarni')) return 'Sangeetha Kulkarni';
  if (lower.includes('ajay koushik')) return 'Ajay Koushik H S';
  if (lower.includes('prajwal s gowda') || lower.includes('prajwalsrinath')) return 'Prajwal S Gowda';
  if (lower.includes('pranvir')) return 'Pranvir';
  if (lower.includes('aditya m koundinya')) return 'Aditya M Koundinya';
  if (lower.includes('jitendra prasad')) return 'Jitendra Prasad';
  if (lower.includes('ninad s koranne')) return 'Ninad S Koranne';
  if (lower.includes('balaji n')) return 'Balaji N';
  if (lower.includes('santhosh kumar')) return 'Santhosh Kumar K';
  if (lower.includes('ashwath t')) return 'Ashwath T';
  if (lower.includes('vijeth h r')) return 'Vijeth H R';
  if (lower.includes('c a rekha')) return 'C A Rekha';
  if (lower.includes('ankush c g')) return 'Ankush C G';
  if (lower.includes('rajesha s')) return 'Rajesha S';
  if (lower.includes('shashikala r')) return 'Shashikala R';
  if (lower.includes('jain corner')) return 'Jain Corner';
  if (lower.includes('nandhi enterprises')) return 'Nandhi Enterprises';
  if (lower.includes('raghavendra')) return 'Raghavendra';
  if (lower.includes('canteen') || lower.includes('rnsit canteen')) return 'College Canteen';
  if (lower.includes('xerox') || lower.includes('photocopy')) return 'College Xerox & Stationery';
  if (lower.includes('swiggy')) return 'Swiggy';
  if (lower.includes('zomato')) return 'Zomato';
  if (lower.includes('zepto')) return 'Zepto';
  if (lower.includes('blinkit')) return 'Blinkit';
  if (lower.includes('instamart')) return 'Instamart';
  if (lower.includes('rapido')) return 'Rapido';
  if (lower.includes('uber')) return 'Uber';
  if (lower.includes('ola')) return 'Ola';
  if (lower.includes('irctc')) return 'IRCTC Trains';
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('flipkart')) return 'Flipkart';
  if (lower.includes('myntra')) return 'Myntra';
  if (lower.includes('zudio')) return 'Zudio';
  if (lower.includes('decathlon')) return 'Decathlon';
  if (lower.includes('chai') || lower.includes('tea point')) return 'Chai Point / Tea Stall';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('pvr') || lower.includes('inox') || lower.includes('bookmyshow')) return 'Cinema (PVR/Inox)';
  if (lower.includes('airtel')) return 'Airtel';
  if (lower.includes('jio')) return 'Jio';
  if (lower.includes('apollo')) return 'Apollo Pharmacy';
  if (lower.includes('zerodha')) return 'Zerodha';
  if (lower.includes('cred')) return 'CRED';
  if (lower.includes('allowance') || lower.includes('pocket money') || lower.includes('parents')) return 'Parents Allowance';

  // 2. Extract from standard UPI narration: UPI/<RRN>/<Merchant Name>/...
  const upiMatch = clean.match(/UPI(?:\/|-)(?:\d{6,}\/)?([A-Za-z0-9\s._&-]+?)(?:\/|$)/i);
  if (upiMatch && upiMatch[1]) {
    const candidate = upiMatch[1].replace(/[0-9]{6,}/g, '').trim();
    if (candidate.length > 2 && !candidate.startsWith('@')) {
      return candidate.slice(0, 30);
    }
  }

  // 3. Strip leading standard banking prefixes
  let formatted = clean
    .replace(/^(UPI\/[0-9]+\/|UPI-|POS\s+|NEFT-|IMPS-|BBPS\/|ACH\/|NACH\/|ECS\/|MMT\/)/i, '')
    .replace(/\/[A-Z0-9_-]+$/i, '')
    .replace(/[0-9]{6,}/g, '')
    .trim();

  // If description has separators like '/' or '-', grab first meaningful part
  if (formatted.includes('/')) {
    const part = formatted.split('/')[0].trim();
    if (part.length > 2) formatted = part;
  }
  if (formatted.includes('-')) {
    const part = formatted.split('-')[0].trim();
    if (part.length > 2) formatted = part;
  }

  if (formatted.length > 30) {
    formatted = formatted.slice(0, 30) + '...';
  }

  return formatted || clean;
}

/**
 * Suggests a spending category based on description, merchant, and transaction type.
 */
export function suggestCategory(description: string, typeHint?: TransactionType): string {
  const text = description.toLowerCase();

  if (typeHint === 'income') {
    if (text.includes('refund') || text.includes('revers') || text.includes('cashback')) {
      return 'Refunds & Reversals';
    }
    return 'Income & Allowance';
  }

  if (typeHint === 'transfer') {
    return 'Transfers & Peer Payments';
  }

  // Check specific categories by priority
  for (const cat of SPENDING_CATEGORIES) {
    if (cat.id === 'other' || cat.id === 'needs_review' || cat.id === 'income') continue;
    for (const kw of cat.keywords) {
      if (kw.length <= 3) {
        // Enforce word boundaries for short keywords like "vi", "bus", "tea", "pg", "gas", "ola"
        const regex = new RegExp(`(?:^|[^a-z0-9])${kw}(?:[^a-z0-9]|$)`, 'i');
        if (regex.test(text)) {
          return cat.name;
        }
      } else if (text.includes(kw)) {
        return cat.name;
      }
    }
  }

  // Check if description has peer UPI transfers
  if (
    text.includes('payment from phonepe') ||
    text.includes('@ybl') ||
    text.includes('@axl') ||
    text.includes('@okaxis') ||
    text.includes('@okicici') ||
    text.includes('@okhdfcbank') ||
    text.includes('@ptys') ||
    text.includes('bharatpe')
  ) {
    return 'Transfers & Peer Payments';
  }

  return 'Other & Miscellaneous';
}

/**
 * Detects if a transaction is likely an Income, Transfer, or Expense.
 */
export function inferTransactionType(
  rawType: string = '',
  amount: number = 0,
  description: string = '',
  debitCol?: number,
  creditCol?: number
): TransactionType {
  // If explicitly provided via separate debit/credit column
  if (creditCol !== undefined && creditCol > 0 && (!debitCol || debitCol === 0)) {
    return 'income';
  }
  if (debitCol !== undefined && debitCol > 0) {
    return 'expense';
  }

  const typeClean = rawType.trim().toUpperCase();
  if (typeClean === 'CR' || typeClean === 'CREDIT' || typeClean === 'DEPOSIT') {
    return 'income';
  }
  if (typeClean === 'DR' || typeClean === 'DEBIT' || typeClean === 'WITHDRAWAL') {
    return 'expense';
  }

  const text = (rawType + ' ' + description).toLowerCase();

  if (
    text.includes('credit') ||
    text.includes('salary') ||
    text.includes('stipend') ||
    text.includes('allowance') ||
    text.includes('received from') ||
    text.includes('cashback') ||
    text.includes('interest paid') ||
    text.includes('credit interest') ||
    text.includes('dividend')
  ) {
    return 'income';
  }

  if (
    text.includes('self transfer') ||
    text.includes('transferred to self') ||
    text.includes('own account') ||
    text.includes('sweep trf') ||
    text.includes('trf to self')
  ) {
    return 'transfer';
  }

  return 'expense';
}
