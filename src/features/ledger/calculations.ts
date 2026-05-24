import type { CategorySummary, LedgerSummary, Transaction } from '../../types/ledger';

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateBalance(initialPrincipal: number, transactions: Transaction[]) {
  return roundMoney(
    transactions.reduce((balance, transaction) => {
      return transaction.type === 'income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, initialPrincipal)
  );
}

export function summarizeTransactions(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): LedgerSummary {
  const start = new Date(`${startDate}T00:00:00.000`);
  const end = new Date(`${endDate}T23:59:59.999`);
  const filtered = transactions
    .filter((transaction) => {
      const occurred = new Date(transaction.occurredAt);
      return occurred >= start && occurred <= end;
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const categoryMap = new Map<string, CategorySummary>();
  let income = 0;
  let expense = 0;

  for (const transaction of filtered) {
    if (transaction.type === 'income') {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }

    const current = categoryMap.get(transaction.categoryId) ?? {
      categoryId: transaction.categoryId,
      income: 0,
      expense: 0,
      net: 0
    };

    if (transaction.type === 'income') {
      current.income = roundMoney(current.income + transaction.amount);
    } else {
      current.expense = roundMoney(current.expense + transaction.amount);
    }
    current.net = roundMoney(current.income - current.expense);
    categoryMap.set(transaction.categoryId, current);
  }

  return {
    income: roundMoney(income),
    expense: roundMoney(expense),
    net: roundMoney(income - expense),
    byCategory: [...categoryMap.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
    transactions: filtered
  };
}
