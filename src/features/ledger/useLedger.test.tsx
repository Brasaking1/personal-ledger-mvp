import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLedger } from './useLedger';
import { LocalLedgerRepository } from './repository';

describe('useLedger', () => {
  it('loads a ledger snapshot and exposes calculated balance', async () => {
    localStorage.clear();
    const repository = new LocalLedgerRepository('hook-test');
    await repository.saveSettings('demo-user', 1000);
    await repository.upsertTransaction('demo-user', {
      type: 'expense',
      amount: 25,
      categoryId: 'expense-food',
      occurredAt: '2026-05-24T12:00:00.000Z',
      note: '咖啡',
      source: 'manual',
      paymentChannel: 'wechat',
      externalKey: null
    });

    const { result } = renderHook(() => useLedger(repository, 'demo-user'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.currentBalance).toBe(975);
  });
});
