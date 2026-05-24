import { beforeEach, describe, expect, it } from 'vitest';
import { LocalLedgerRepository } from './repository';

describe('LocalLedgerRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates default settings and categories for a new user', async () => {
    const repo = new LocalLedgerRepository('test-ledger');
    const snapshot = await repo.load('user-1');

    expect(snapshot.settings.initialPrincipal).toBe(0);
    expect(snapshot.categories.some((category) => category.name === '餐饮')).toBe(true);
    expect(snapshot.categories.some((category) => category.name === '理财收入')).toBe(true);
    expect(snapshot.categories.some((category) => category.name === '亏损')).toBe(true);
    expect(snapshot.transactions).toEqual([]);
  });

  it('updates existing local ledgers with new system categories', async () => {
    localStorage.setItem(
      'test-ledger',
      JSON.stringify({
        settingsByUser: {
          'user-1': {
            userId: 'user-1',
            initialPrincipal: 0,
            currency: 'CNY',
            createdAt: '2026-05-01T00:00:00.000Z',
            updatedAt: '2026-05-01T00:00:00.000Z'
          }
        },
        categoriesByUser: {
          'user-1': [
            {
              id: 'income-investment',
              userId: 'user-1',
              name: '投资收益',
              type: 'income',
              color: '#9333ea',
              icon: 'trending-up',
              isSystem: true,
              sortOrder: 6,
              createdAt: '2026-05-01T00:00:00.000Z',
              updatedAt: '2026-05-01T00:00:00.000Z'
            }
          ]
        },
        transactionsByUser: { 'user-1': [] }
      })
    );

    const repo = new LocalLedgerRepository('test-ledger');
    const snapshot = await repo.load('user-1');

    expect(snapshot.categories.find((category) => category.id === 'income-investment')?.name).toBe('理财收入');
    expect(snapshot.categories.some((category) => category.id === 'expense-investment-loss')).toBe(true);
  });

  it('persists settings and transactions', async () => {
    const repo = new LocalLedgerRepository('test-ledger');
    await repo.saveSettings('user-1', 50000);
    await repo.upsertTransaction('user-1', {
      type: 'expense',
      amount: 30,
      categoryId: 'expense-food',
      occurredAt: '2026-05-02T12:00:00.000Z',
      note: '午饭',
      source: 'manual',
      paymentChannel: 'wechat',
      externalKey: null
    });

    const snapshot = await repo.load('user-1');

    expect(snapshot.settings.initialPrincipal).toBe(50000);
    expect(snapshot.transactions).toHaveLength(1);
    expect(snapshot.transactions[0].note).toBe('午饭');
  });
});
