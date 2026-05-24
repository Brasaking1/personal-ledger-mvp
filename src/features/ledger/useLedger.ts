import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateBalance } from './calculations';
import type { LedgerRepository, NewTransactionInput } from './repository';
import type { Category, LedgerSettings, Transaction } from '../../types/ledger';

type Status = 'loading' | 'ready' | 'error';

export function useLedger(repository: LedgerRepository, userId: string) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<LedgerSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncMode, setSyncMode] = useState<'local' | 'cloud'>('local');

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const snapshot = await repository.load(userId);
      setSettings(snapshot.settings);
      setCategories(snapshot.categories);
      setTransactions(snapshot.transactions);
      setSyncMode(snapshot.syncMode);
      setStatus('ready');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '账本加载失败');
      setStatus('error');
    }
  }, [repository, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveInitialPrincipal = useCallback(
    async (initialPrincipal: number) => {
      const next = await repository.saveSettings(userId, initialPrincipal);
      setSettings(next);
    },
    [repository, userId]
  );

  const saveCategory = useCallback(
    async (category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const saved = await repository.upsertCategory(userId, category);
      setCategories((current) =>
        current.some((item) => item.id === saved.id)
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved]
      );
      return saved;
    },
    [repository, userId]
  );

  const saveTransaction = useCallback(
    async (transaction: NewTransactionInput & { id?: string }) => {
      const saved = await repository.upsertTransaction(userId, transaction);
      setTransactions((current) =>
        current.some((item) => item.id === saved.id)
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
      );
      return saved;
    },
    [repository, userId]
  );

  const deleteTransaction = useCallback(
    async (transactionId: string) => {
      await repository.deleteTransaction(userId, transactionId);
      setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
    },
    [repository, userId]
  );

  const currentBalance = useMemo(
    () => calculateBalance(settings?.initialPrincipal ?? 0, transactions),
    [settings?.initialPrincipal, transactions]
  );

  return {
    status,
    error,
    settings,
    categories,
    transactions,
    syncMode,
    currentBalance,
    reload,
    saveInitialPrincipal,
    saveCategory,
    saveTransaction,
    deleteTransaction
  };
}
