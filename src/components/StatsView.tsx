import { useMemo, useState } from 'react';
import { summarizeTransactions } from '../features/ledger/calculations';
import type { Category, Transaction } from '../types/ledger';

const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' });
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const monthStart = () => {
  const date = new Date();
  return isoDate(new Date(date.getFullYear(), date.getMonth(), 1));
};

const categoryName = (categories: Category[], categoryId: string) =>
  categories.find((category) => category.id === categoryId)?.name ?? categoryId;

export function StatsView({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(isoDate(new Date()));
  const summary = useMemo(() => summarizeTransactions(transactions, startDate, endDate), [transactions, startDate, endDate]);

  return (
    <section className="stack">
      <div className="date-range">
        <label>
          <span>开始</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          <span>结束</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>

      <div className="metric-grid three">
        <div className="metric-card"><span>收入</span><strong>{money.format(summary.income)}</strong></div>
        <div className="metric-card"><span>支出</span><strong>{money.format(summary.expense)}</strong></div>
        <div className="metric-card"><span>净额</span><strong>{money.format(summary.net)}</strong></div>
      </div>

      <section className="section-block">
        <div className="section-heading"><h2>分类汇总</h2></div>
        {summary.byCategory.length === 0 ? (
          <p className="empty-state">当前范围没有记录</p>
        ) : (
          <ul className="summary-list">
            {summary.byCategory.map((item) => (
              <li key={item.categoryId}>
                <span>{categoryName(categories, item.categoryId)}</span>
                <strong>{money.format(Math.abs(item.net))}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading"><h2>明细</h2></div>
        <ul className="transaction-list">
          {summary.transactions.map((transaction) => (
            <li key={transaction.id}>
              <div>
                <strong>{categoryName(categories, transaction.categoryId)}</strong>
                <span>{new Date(transaction.occurredAt).toLocaleDateString('zh-CN')} {transaction.note}</span>
              </div>
              <span className={transaction.type}>{transaction.type === 'income' ? '+' : '-'}{money.format(transaction.amount)}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
