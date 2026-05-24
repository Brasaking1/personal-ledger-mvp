import { defaultCategories } from './defaultCategories';
import type {
  Category,
  LedgerSettings,
  PaymentChannel,
  Transaction,
  TransactionSource,
  TransactionType
} from '../../types/ledger';

export interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  occurredAt: string;
  note: string;
  source: TransactionSource;
  paymentChannel: PaymentChannel;
  externalKey: string | null;
}

export interface LedgerSnapshot {
  settings: LedgerSettings;
  categories: Category[];
  transactions: Transaction[];
  syncMode: 'local' | 'cloud';
}

export interface LedgerRepository {
  load(userId: string): Promise<LedgerSnapshot>;
  saveSettings(userId: string, initialPrincipal: number): Promise<LedgerSettings>;
  upsertCategory(
    userId: string,
    category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<Category>;
  upsertTransaction(userId: string, transaction: NewTransactionInput & { id?: string }): Promise<Transaction>;
  deleteTransaction(userId: string, transactionId: string): Promise<void>;
}

interface LocalStore {
  settingsByUser: Record<string, LedgerSettings>;
  categoriesByUser: Record<string, Category[]>;
  transactionsByUser: Record<string, Transaction[]>;
}

const now = () => new Date().toISOString();

const createSettings = (userId: string): LedgerSettings => ({
  userId,
  initialPrincipal: 0,
  currency: 'CNY',
  createdAt: now(),
  updatedAt: now()
});

export const cloneDefaultCategories = (userId: string) =>
  defaultCategories.map((category) => ({
    ...category,
    userId,
    createdAt: now(),
    updatedAt: now()
  }));

export class LocalLedgerRepository implements LedgerRepository {
  constructor(private readonly storageKey = 'personal-ledger') {}

  async load(userId: string): Promise<LedgerSnapshot> {
    const store = this.ensureUser(userId);
    this.write(store);

    return {
      settings: store.settingsByUser[userId],
      categories: store.categoriesByUser[userId],
      transactions: store.transactionsByUser[userId],
      syncMode: 'local'
    };
  }

  async saveSettings(userId: string, initialPrincipal: number): Promise<LedgerSettings> {
    const store = this.ensureUser(userId);
    const existing = store.settingsByUser[userId];
    const settings = { ...existing, initialPrincipal, updatedAt: now() };
    store.settingsByUser[userId] = settings;
    this.write(store);
    return settings;
  }

  async upsertCategory(
    userId: string,
    input: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) {
    const store = this.ensureUser(userId);
    const categories = store.categoriesByUser[userId];
    const existing = input.id ? categories.find((category) => category.id === input.id) : undefined;
    const category: Category = {
      id: input.id ?? crypto.randomUUID(),
      userId,
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
      isSystem: input.isSystem,
      sortOrder: input.sortOrder,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now()
    };
    store.categoriesByUser[userId] = existing
      ? categories.map((item) => (item.id === category.id ? category : item))
      : [...categories, category];
    this.write(store);
    return category;
  }

  async upsertTransaction(userId: string, input: NewTransactionInput & { id?: string }): Promise<Transaction> {
    const store = this.ensureUser(userId);
    const transactions = store.transactionsByUser[userId];
    const existing = input.id ? transactions.find((transaction) => transaction.id === input.id) : undefined;
    const transaction: Transaction = {
      id: input.id ?? crypto.randomUUID(),
      userId,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId,
      occurredAt: input.occurredAt,
      note: input.note,
      source: input.source,
      paymentChannel: input.paymentChannel,
      externalKey: input.externalKey,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now()
    };

    const duplicate = transaction.externalKey
      ? transactions.find((item) => item.source === transaction.source && item.externalKey === transaction.externalKey)
      : undefined;

    if (duplicate && duplicate.id !== transaction.id) {
      return duplicate;
    }

    store.transactionsByUser[userId] = existing
      ? transactions.map((item) => (item.id === transaction.id ? transaction : item))
      : [transaction, ...transactions];
    this.write(store);
    return transaction;
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const store = this.ensureUser(userId);
    store.transactionsByUser[userId] = store.transactionsByUser[userId].filter(
      (transaction) => transaction.id !== transactionId
    );
    this.write(store);
  }

  private ensureUser(userId: string) {
    const store = this.read();
    store.settingsByUser[userId] ??= createSettings(userId);
    store.categoriesByUser[userId] ??= cloneDefaultCategories(userId);
    store.transactionsByUser[userId] ??= [];
    return store;
  }

  private read(): LocalStore {
    const raw = localStorage.getItem(this.storageKey);
    return raw
      ? JSON.parse(raw)
      : { settingsByUser: {}, categoriesByUser: {}, transactionsByUser: {} };
  }

  private write(store: LocalStore) {
    localStorage.setItem(this.storageKey, JSON.stringify(store));
  }
}
