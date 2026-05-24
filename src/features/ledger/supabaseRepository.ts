import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  cloneDefaultCategories,
  LocalLedgerRepository,
  type LedgerRepository,
  type LedgerSnapshot,
  type NewTransactionInput
} from './repository';
import type { Category, LedgerSettings, Transaction } from '../../types/ledger';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabaseConfig = Boolean(url && anonKey);
export const supabaseClient = hasSupabaseConfig ? createClient(url!, anonKey!) : null;

export function createLedgerRepository(): LedgerRepository {
  if (!supabaseClient) {
    return new LocalLedgerRepository();
  }
  return new SupabaseLedgerRepository(supabaseClient);
}

export class SupabaseLedgerRepository implements LedgerRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: string): Promise<LedgerSnapshot> {
    const [settingsResult, categoriesResult, transactionsResult] = await Promise.all([
      this.client.from('ledger_settings').select('*').eq('user_id', userId).maybeSingle(),
      this.client.from('categories').select('*').eq('user_id', userId).order('sort_order'),
      this.client.from('transactions').select('*').eq('user_id', userId).order('occurred_at', { ascending: false })
    ]);

    if (settingsResult.error) throw settingsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (transactionsResult.error) throw transactionsResult.error;

    const settings = settingsResult.data ? mapSettings(settingsResult.data) : await this.saveSettings(userId, 0);
    const categories = categoriesResult.data?.length
      ? categoriesResult.data.map(mapCategory)
      : await this.seedDefaultCategories(userId);

    return {
      settings,
      categories,
      transactions: (transactionsResult.data ?? []).map(mapTransaction),
      syncMode: 'cloud'
    };
  }

  async saveSettings(userId: string, initialPrincipal: number): Promise<LedgerSettings> {
    const { data, error } = await this.client
      .from('ledger_settings')
      .upsert({ user_id: userId, initial_principal: initialPrincipal, currency: 'CNY', updated_at: new Date().toISOString() })
      .select('*')
      .single();
    if (error) throw error;
    return mapSettings(data);
  }

  async upsertCategory(
    userId: string,
    category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) {
    const { data, error } = await this.client
      .from('categories')
      .upsert(
        {
          id: category.id ?? crypto.randomUUID(),
          user_id: userId,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          is_system: category.isSystem,
          sort_order: category.sortOrder,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,id' }
      )
      .select('*')
      .single();
    if (error) throw error;
    return mapCategory(data);
  }

  async upsertTransaction(userId: string, transaction: NewTransactionInput & { id?: string }): Promise<Transaction> {
    const { data, error } = await this.client
      .from('transactions')
      .upsert({
        id: transaction.id,
        user_id: userId,
        type: transaction.type,
        amount: transaction.amount,
        category_id: transaction.categoryId,
        occurred_at: transaction.occurredAt,
        note: transaction.note,
        source: transaction.source,
        payment_channel: transaction.paymentChannel,
        external_key: transaction.externalKey,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapTransaction(data);
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const { error } = await this.client.from('transactions').delete().eq('user_id', userId).eq('id', transactionId);
    if (error) throw error;
  }

  private async seedDefaultCategories(userId: string) {
    const rows = cloneDefaultCategories(userId).map((category) => ({
      id: category.id,
      user_id: userId,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      is_system: category.isSystem,
      sort_order: category.sortOrder,
      updated_at: category.updatedAt
    }));
    const { data, error } = await this.client.from('categories').upsert(rows, { onConflict: 'user_id,id' }).select('*');
    if (error) throw error;
    return (data ?? []).map(mapCategory);
  }
}

const mapSettings = (row: Record<string, unknown>): LedgerSettings => ({
  userId: String(row.user_id),
  initialPrincipal: Number(row.initial_principal),
  currency: 'CNY',
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at)
});

const mapCategory = (row: Record<string, unknown>): Category => ({
  id: String(row.id),
  userId: String(row.user_id),
  name: String(row.name),
  type: row.type === 'income' ? 'income' : 'expense',
  color: String(row.color),
  icon: String(row.icon),
  isSystem: Boolean(row.is_system),
  sortOrder: Number(row.sort_order),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at)
});

const mapTransaction = (row: Record<string, unknown>): Transaction => ({
  id: String(row.id),
  userId: String(row.user_id),
  type: row.type === 'income' ? 'income' : 'expense',
  amount: Number(row.amount),
  categoryId: String(row.category_id),
  occurredAt: String(row.occurred_at),
  note: String(row.note ?? ''),
  source: row.source === 'wechat_import' ? 'wechat_import' : row.source === 'alipay_import' ? 'alipay_import' : 'manual',
  paymentChannel:
    row.payment_channel === 'wechat' ||
    row.payment_channel === 'alipay' ||
    row.payment_channel === 'cash' ||
    row.payment_channel === 'bank_card'
      ? row.payment_channel
      : 'other',
  externalKey: row.external_key ? String(row.external_key) : null,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at)
});
