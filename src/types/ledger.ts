export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'wechat_import' | 'alipay_import';
export type PaymentChannel = 'wechat' | 'alipay' | 'cash' | 'bank_card' | 'other';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  occurredAt: string;
  note: string;
  source: TransactionSource;
  paymentChannel: PaymentChannel;
  externalKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerSettings {
  userId: string;
  initialPrincipal: number;
  currency: 'CNY';
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  categoryId: string;
  income: number;
  expense: number;
  net: number;
}

export interface LedgerSummary {
  income: number;
  expense: number;
  net: number;
  byCategory: CategorySummary[];
  transactions: Transaction[];
}
