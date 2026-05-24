import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('shows the current balance as the primary number', () => {
    render(
      <Dashboard
        balance={55214}
        periodIncome={8500}
        dayExpense={56}
        weekExpense={1286}
        monthExpense={3286}
        recentTransactions={[]}
        categories={[]}
        onAddIncome={() => undefined}
        onAddExpense={() => undefined}
      />
    );

    expect(screen.getByText('当前余额')).toBeInTheDocument();
    expect(screen.getByText('¥55,214.00')).toBeInTheDocument();
  });

  it('shows day, week, and month expense totals', () => {
    render(
      <Dashboard
        balance={55214}
        periodIncome={8500}
        dayExpense={56}
        weekExpense={1286}
        monthExpense={3286}
        recentTransactions={[]}
        categories={[]}
        onAddIncome={() => undefined}
        onAddExpense={() => undefined}
      />
    );

    expect(screen.getByText('今日支出')).toBeInTheDocument();
    expect(screen.getByText('本周支出')).toBeInTheDocument();
    expect(screen.getByText('本月支出')).toBeInTheDocument();
    expect(screen.getByText('¥56.00')).toBeInTheDocument();
    expect(screen.getByText('¥1,286.00')).toBeInTheDocument();
    expect(screen.getByText('¥3,286.00')).toBeInTheDocument();
  });
});
