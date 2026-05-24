import { describe, expect, it } from 'vitest';
import { calculateBalance, summarizeTransactions } from './calculations';
import type { Transaction } from '../../types/ledger';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: crypto.randomUUID(),
  userId: 'user-1',
  type: 'expense',
  amount: 100,
  categoryId: 'food',
  occurredAt: '2026-05-01T12:00:00.000Z',
  note: '',
  source: 'manual',
  paymentChannel: 'wechat',
  externalKey: null,
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-01T12:00:00.000Z',
  ...overrides
});

describe('ledger calculations', () => {
  it('calculates current balance from principal plus income minus expense', () => {
    const result = calculateBalance(50000, [
      tx({ type: 'income', amount: 8500 }),
      tx({ type: 'expense', amount: 3286 })
    ]);

    expect(result).toBe(55214);
  });

  it('summarizes arbitrary date ranges and category totals', () => {
    const summary = summarizeTransactions(
      [
        tx({ id: 'a', type: 'expense', amount: 30, categoryId: 'food', occurredAt: '2026-05-02T00:00:00.000Z' }),
        tx({ id: 'b', type: 'income', amount: 200, categoryId: 'salary', occurredAt: '2026-05-03T00:00:00.000Z' }),
        tx({ id: 'c', type: 'expense', amount: 99, categoryId: 'shopping', occurredAt: '2026-04-30T00:00:00.000Z' })
      ],
      '2026-05-01',
      '2026-05-31'
    );

    expect(summary.income).toBe(200);
    expect(summary.expense).toBe(30);
    expect(summary.net).toBe(170);
    expect(summary.byCategory).toEqual([
      { categoryId: 'salary', income: 200, expense: 0, net: 200 },
      { categoryId: 'food', income: 0, expense: 30, net: -30 }
    ]);
  });
});
