import { useState } from 'react';
import { parseBillText, type ImportSource, type ParsedImportRow } from '../features/ledger/importers';
import type { NewTransactionInput } from '../features/ledger/repository';
import type { Category, LedgerSettings, TransactionType } from '../types/ledger';

export function SettingsView({
  settings,
  categories,
  syncMode,
  onSavePrincipal,
  onSaveCategory,
  onImportTransactions
}: {
  settings: LedgerSettings | null;
  categories: Category[];
  syncMode: 'local' | 'cloud';
  onSavePrincipal: (value: number) => void | Promise<void>;
  onSaveCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => unknown | Promise<unknown>;
  onImportTransactions: (transactions: NewTransactionInput[]) => void | Promise<void>;
}) {
  const [principal, setPrincipal] = useState(String(settings?.initialPrincipal ?? 0));
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<TransactionType>('expense');
  const [importSource, setImportSource] = useState<ImportSource>('wechat');
  const [previewRows, setPreviewRows] = useState<ParsedImportRow[]>([]);
  const [importMessage, setImportMessage] = useState('');

  const savePrincipal = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSavePrincipal(Number(principal) || 0);
  };

  const parseFile = async (file: File) => {
    let text: string;
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer());
      text = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    } else {
      text = await file.text();
    }
    const rows = parseBillText(importSource, text);
    setPreviewRows(rows);
    setImportMessage(`已解析 ${rows.length} 条`);
  };

  const confirmImport = async () => {
    const readyRows = previewRows.filter((row) => !row.needsReview);
    await onImportTransactions(readyRows.map(({ raw: _raw, needsReview: _needsReview, ...transaction }) => transaction));
    setImportMessage(`已导入 ${readyRows.length} 条`);
    setPreviewRows([]);
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
            <select value={importSource} onChange={(event) => setImportSource(event.target.value as ImportSource)}>
              <option value="wechat">微信</option>
              <option value="alipay">支付宝</option>
            </select>
          </label>
          <label>
            <span>文件</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void parseFile(file);
              }}
            />
          </label>
        </div>
        {importMessage && <p className="sync-line">{importMessage}</p>}
        {previewRows.length > 0 && (
          <>
            <ul className="transaction-list import-preview">
              {previewRows.slice(0, 8).map((row, index) => (
                <li key={`${row.externalKey ?? index}`}>
                  <div>
                    <strong>{row.note || '未识别记录'}</strong>
                    <span>{row.needsReview ? '需要检查' : row.type === 'income' ? '收入' : '支出'}</span>
                  </div>
                  <span className={row.type}>¥{row.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <button className="submit-button" type="button" onClick={confirmImport}>确认导入</button>
          </>
        )}
      </section>
    </section>
  );
}
