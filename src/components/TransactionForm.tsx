import { useMemo, useState } from 'react';
import { toDateInputValue } from '../features/ledger/date';
import type { NewTransactionInput } from '../features/ledger/repository';
import type { Category, PaymentChannel, TransactionType } from '../types/ledger';

const today = () => toDateInputValue(new Date());

export function TransactionForm({
  categories,
  defaultType,
  onSubmit
}: {
  categories: Category[];
  defaultType: TransactionType;
  onSubmit: (transaction: NewTransactionInput) => void | Promise<void>;
}) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [occurredOn, setOccurredOn] = useState(today());
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('wechat');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const visibleCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);
  const selectedCategoryId = categoryId || visibleCategories[0]?.id || '';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('请输入正确金额');
      return;
    }
    if (!selectedCategoryId) {
      setError('请选择分类');
      return;
    }
    setError('');
    await onSubmit({
      type,
      amount: numericAmount,
      categoryId: selectedCategoryId,
      occurredAt: new Date(`${occurredOn}T12:00:00`).toISOString(),
      note,
      source: 'manual',
      paymentChannel,
      externalKey: null
    });
    setAmount('');
    setNote('');
  };

  return (
    <form className="entry-form" onSubmit={submit}>
      <div className="segmented" aria-label="收支类型">
        <button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>
          支出
        </button>
        <button type="button" className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>
          收入
        </button>
      </div>

      <label>
        <span>金额</span>
        <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
      </label>

      <label>
        <span>分类</span>
        <select value={selectedCategoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>日期</span>
        <input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} />
      </label>

      <label>
        <span>支付来源</span>
        <select value={paymentChannel} onChange={(event) => setPaymentChannel(event.target.value as PaymentChannel)}>
          <option value="wechat">微信</option>
          <option value="alipay">支付宝</option>
          <option value="cash">现金</option>
          <option value="bank_card">银行卡</option>
          <option value="other">其他</option>
        </select>
      </label>

      <label>
        <span>备注</span>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="可选" />
      </label>

      {error && <p className="error-text">{error}</p>}
      <button className="submit-button" type="submit">保存</button>
    </form>
  );
}
