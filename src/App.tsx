import { useMemo, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Navigation, type AppView } from './components/Navigation';
import { SettingsView } from './components/SettingsView';
import { StatsView } from './components/StatsView';
import { TransactionForm } from './components/TransactionForm';
import { createLedgerRepository } from './features/ledger/supabaseRepository';
import { useLedger } from './features/ledger/useLedger';
import { summarizeTransactions } from './features/ledger/calculations';
import type { TransactionType } from './types/ledger';

const viewTitle: Record<AppView, string> = {
  home: '首页',
  entry: '记账',
  stats: '统计',
  settings: '设置'
};

export function App() {
  const repository = useMemo(() => createLedgerRepository(), []);
  const ledger = useLedger(repository, 'demo-user');
  const [activeView, setActiveView] = useState<AppView>('home');
  const [entryType, setEntryType] = useState<TransactionType>('expense');

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = today.toISOString().slice(0, 10);
  const monthSummary = summarizeTransactions(ledger.transactions, monthStart, monthEnd);

  const openEntry = (type: TransactionType) => {
    setEntryType(type);
    setActiveView('entry');
  };

  return (
    <div className="app-layout">
      <Navigation active={activeView} onChange={setActiveView} />
      <main className="app-main">
        <header className="top-bar">
          <div>
            <p className="eyebrow">我的账本</p>
            <h1>{viewTitle[activeView]}</h1>
          </div>
          <span className={`sync-badge ${ledger.syncMode}`}>{ledger.syncMode === 'cloud' ? '云同步' : '本地演示'}</span>
        </header>
        {ledger.status === 'loading' && <p className="muted">正在加载账本</p>}
        {ledger.status === 'error' && <p className="error-text">{ledger.error}</p>}
        {ledger.status === 'ready' && (
          <>
            {activeView === 'home' && (
              <Dashboard
                balance={ledger.currentBalance}
                periodIncome={monthSummary.income}
                periodExpense={monthSummary.expense}
                recentTransactions={ledger.transactions.slice(0, 6)}
                categories={ledger.categories}
                onAddIncome={() => openEntry('income')}
                onAddExpense={() => openEntry('expense')}
              />
            )}
            {activeView === 'entry' && (
              <TransactionForm
                categories={ledger.categories}
                defaultType={entryType}
                onSubmit={async (transaction) => {
                  await ledger.saveTransaction(transaction);
                  setActiveView('home');
                }}
              />
            )}
            {activeView === 'stats' && <StatsView transactions={ledger.transactions} categories={ledger.categories} />}
            {activeView === 'settings' && (
              <SettingsView
                settings={ledger.settings}
                categories={ledger.categories}
                syncMode={ledger.syncMode}
                onSavePrincipal={ledger.saveInitialPrincipal}
                onSaveCategory={ledger.saveCategory}
                onImportTransactions={async (transactions) => {
                  for (const transaction of transactions) {
                    await ledger.saveTransaction(transaction);
                  }
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
