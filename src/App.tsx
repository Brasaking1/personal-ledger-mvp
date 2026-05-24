import { useMemo, useState } from 'react';
import { Navigation, type AppView } from './components/Navigation';
import { createLedgerRepository } from './features/ledger/supabaseRepository';
import { useLedger } from './features/ledger/useLedger';

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
        {ledger.status === 'ready' && <p className="muted">当前余额 ¥{ledger.currentBalance.toLocaleString('zh-CN')}</p>}
      </main>
    </div>
  );
}
