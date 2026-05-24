import { useState } from 'react';
import type { Category, LedgerSettings, TransactionType } from '../types/ledger';

export function SettingsView({
  settings,
  categories,
  syncMode,
  onSavePrincipal,
  onSaveCategory
}: {
  settings: LedgerSettings | null;
  categories: Category[];
  syncMode: 'local' | 'cloud';
  onSavePrincipal: (value: number) => void | Promise<void>;
  onSaveCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => unknown | Promise<unknown>;
}) {
  const [principal, setPrincipal] = useState(String(settings?.initialPrincipal ?? 0));
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<TransactionType>('expense');

  const savePrincipal = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSavePrincipal(Number(principal) || 0);
  };

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    await onSaveCategory({
      name: categoryName.trim(),
      type: categoryType,
      color: categoryType === 'income' ? '#059669' : '#ea580c',
      icon: categoryType === 'income' ? 'wallet' : 'receipt',
      isSystem: false,
      sortOrder: categories.length + 1
    });
    setCategoryName('');
  };

  return (
    <section className="settings-grid">
      <form className="section-block form-card" onSubmit={savePrincipal}>
        <div className="section-heading"><h2>初始本金</h2></div>
        <label>
          <span>金额</span>
          <input inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value)} />
        </label>
        <button className="submit-button" type="submit">保存本金</button>
      </form>

      <section className="section-block">
        <div className="section-heading"><h2>同步</h2></div>
        <p className="sync-line">{syncMode === 'cloud' ? '云同步' : '本地演示'}</p>
      </section>

      <form className="section-block form-card" onSubmit={addCategory}>
        <div className="section-heading"><h2>分类</h2></div>
        <div className="date-range">
          <label>
            <span>类型</span>
            <select value={categoryType} onChange={(event) => setCategoryType(event.target.value as TransactionType)}>
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </label>
          <label>
            <span>名称</span>
            <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          </label>
        </div>
        <button className="submit-button" type="submit">新增分类</button>
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id}><span>{category.name}</span><small>{category.type === 'income' ? '收入' : '支出'}</small></li>
          ))}
        </ul>
      </form>

      <section className="section-block">
        <div className="section-heading"><h2>账单导入</h2></div>
        <div className="date-range">
          <label>
            <span>来源</span>
            <select disabled>
              <option>微信</option>
              <option>支付宝</option>
            </select>
          </label>
          <label>
            <span>文件</span>
            <input type="file" disabled />
          </label>
        </div>
      </section>
    </section>
  );
}
