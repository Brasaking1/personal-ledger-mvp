import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('shows the current balance as the primary number', () => {
    render(
      <Dashboard
        balance={55214}
        periodIncome={8500}
        periodExpense={3286}
        recentTransactions={[]}
        categories={[]}
        onAddIncome={() => undefined}
        onAddExpense={() => undefined}
      />
    );

    expect(screen.getByText('当前余额')).toBeInTheDocument();
    expect(screen.getByText('¥55,214.00')).toBeInTheDocument();
  });
});
