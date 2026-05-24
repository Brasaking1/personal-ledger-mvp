import Papa from 'papaparse';
import type { NewTransactionInput } from './repository';

export type ImportSource = 'wechat' | 'alipay';

export interface ParsedImportRow extends NewTransactionInput {
  raw: Record<string, string>;
  needsReview: boolean;
}

const amountFrom = (value: string) => Number(value.replace(/[¥￥,\s]/g, ''));
const compact = (...parts: Array<string | undefined>) => parts.map((part) => part?.trim()).filter(Boolean).join(' ');

export function parseBillText(source: ImportSource, text: string): ParsedImportRow[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  return parsed.data
    .filter((row) => Object.values(row).some((value) => value?.trim()))
    .map((row) => normalizeRow(source, row));
}

function normalizeRow(source: ImportSource, row: Record<string, string>): ParsedImportRow {
  const isWechat = source === 'wechat';
  const direction = row['收/支'] ?? row['收支'] ?? row['资金流向'] ?? '';
  const amountText = row['金额(元)'] ?? row['金额'] ?? row['交易金额'] ?? '0';
  const amount = amountFrom(amountText);
  const occurredAtText = row['交易时间'] ?? row['交易创建时间'] ?? row['付款时间'] ?? '';
  const externalKey = row['交易单号'] ?? row['交易号'] ?? row['商户单号'] ?? null;
  const type = direction.includes('收入') || direction === '收' || direction.includes('收款') ? 'income' : 'expense';
  const occurredAt = parseOccurredAt(occurredAtText);

  return {
    type,
    amount,
    categoryId: type === 'income' ? guessIncomeCategory(row) : guessExpenseCategory(row),
    occurredAt,
    note: compact(row['交易对方'], row['商品'], row['商品说明']) || compact(row['交易分类'], row['交易类型']),
    source: isWechat ? 'wechat_import' : 'alipay_import',
    paymentChannel: isWechat ? 'wechat' : 'alipay',
    externalKey,
    raw: row,
    needsReview: amount <= 0 || !direction || Number.isNaN(Date.parse(occurredAt))
  };
}

function parseOccurredAt(value: string) {
  const normalized = value ? value.replace(' ', 'T') : new Date().toISOString();
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function guessIncomeCategory(row: Record<string, string>) {
  const text = Object.values(row).join(' ');
  if (/工资|薪资|薪水/.test(text)) return 'income-salary';
  if (/奖金|奖/.test(text)) return 'income-bonus';
  if (/退款|退回/.test(text)) return 'income-refund';
  if (/转账|收款/.test(text)) return 'income-transfer';
  return 'income-other';
}

function guessExpenseCategory(row: Record<string, string>) {
  const text = Object.values(row).join(' ');
  if (/餐|饭|咖啡|奶茶|美团|饿了么|便利店|饮料/.test(text)) return 'expense-food';
  if (/地铁|公交|打车|滴滴|铁路|机票/.test(text)) return 'expense-transport';
  if (/房租|物业|水费|电费|燃气/.test(text)) return 'expense-housing';
  if (/药|医院|门诊/.test(text)) return 'expense-medical';
  if (/淘宝|京东|拼多多|购物/.test(text)) return 'expense-shopping';
  return 'expense-other';
}
