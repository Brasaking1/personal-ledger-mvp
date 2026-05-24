import { ArrowDownCircle, ArrowUpCircle, PlusCircle } from 'lucide-react';
import type { Category, Transaction } from '../types/ledger';

const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' });

const categoryName = (categories: Category[], categoryId: string) =>
  categories.find((category) => category.id === categoryId)?.name ?? '未分类';

export function Dashboard({
  balance,
  periodIncome,
  periodExpense,
  recentTransactions,
  categories,
  onAddIncome,
  onAddExpense
}: {
  balance: number;
  periodIncome: number;
  periodExpense: number;
  recentTransactions: Transaction[];
  categories: Category[];
  onAddIncome: () => void;
  onAddExpense: () => void;
}) {
  return (
    <section className="stack">
      <div className="balance-panel">
        <span className="panel-label">当前余额</span>
        <strong>{money.format(balance)}</strong>
        <div className="quick-actions" aria-label="快速记账">
          <button className="primary-action expense" onClick={onAddExpense}>
            <PlusCircle size={18} aria-hidden="true" />
            记支出
          </button>
          <button className="primary-action income" onClick={onAddIncome}>
            <PlusCircle size={18} aria-hidden="true" />
            记收入
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <ArrowUpCircle size={20} aria-hidden="true" />
          <span>本期收入</span>
          <strong>{money.format(periodIncome)}</strong>
        </div>
        <div className="metric-card">
          <ArrowDownCircle size={20} aria-hidden="true" />
          <span>本期支出</span>
          <strong>{money.format(periodExpense)}</strong>
        </div>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <h2>最近记录</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="empty-state">还没有记录</p>
        ) : (
          <ul className="transaction-list">
            {recentTransactions.map((transaction) => (
              <li key={transaction.id}>
                <div>
                  <strong>{categoryName(categories, transaction.categoryId)}</strong>
                  <span>{transaction.note || new Date(transaction.occurredAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <span className={transaction.type}>{transaction.type === 'income' ? '+' : '-'}{money.format(transaction.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
