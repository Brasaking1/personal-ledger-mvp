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
    expect(snapshot.transactions).toEqual([]);
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
