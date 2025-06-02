export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  preferredCurrency: string;
  createdAt: string;
}

export interface Group {
  id?: string;
  groupName: string;
  createdBy: string;
  members: string[];
  memberDetails?: UserProfile[];
  groupCode: string;
  createdAt: string;
}

export interface Expense {
  id?: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string;
  paidByUser?: UserProfile;
  splitBetween: string[];
  splitDetails: Record<string, number>;
  notes?: string;
  currency: string;
  createdAt: string;
  groupId: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
  currency: string;
  settled?: boolean;
  settledDate?: string;
  note?: string;
}

export interface Balance {
  userId: string;
  amount: number;
  currency: string;
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
];

export const CURRENCY_RATES: Record<string, Record<string, number>> = {
  'USD': {
    'INR': 83.1,
    'EUR': 0.92,
    'GBP': 0.78,
    'JPY': 150.2,
    'CAD': 1.36,
    'AUD': 1.52,
    'USD': 1,
  },
  'INR': {
    'USD': 0.012,
    'EUR': 0.011,
    'GBP': 0.0094,
    'JPY': 1.81,
    'CAD': 0.016,
    'AUD': 0.018,
    'INR': 1,
  },
  'EUR': {
    'USD': 1.09,
    'INR': 90.5,
    'GBP': 0.85,
    'JPY': 163.5,
    'CAD': 1.48,
    'AUD': 1.65,
    'EUR': 1,
  },
  'GBP': {
    'USD': 1.28,
    'INR': 106.5,
    'EUR': 1.18,
    'JPY': 192.3,
    'CAD': 1.74,
    'AUD': 1.94,
    'GBP': 1,
  },
  'JPY': {
    'USD': 0.0067,
    'INR': 0.55,
    'EUR': 0.0061,
    'GBP': 0.0052,
    'CAD': 0.0091,
    'AUD': 0.01,
    'JPY': 1,
  },
  'CAD': {
    'USD': 0.74,
    'INR': 61.1,
    'EUR': 0.68,
    'GBP': 0.57,
    'JPY': 110.4,
    'AUD': 1.12,
    'CAD': 1,
  },
  'AUD': {
    'USD': 0.66,
    'INR': 54.6,
    'EUR': 0.61,
    'GBP': 0.51,
    'JPY': 98.8,
    'CAD': 0.89,
    'AUD': 1,
  }
};