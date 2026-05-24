import Papa from 'papaparse';
import type { NewTransactionInput } from './repository';

export type ImportSource = 'wechat' | 'alipay';

export interface ParsedImportRow extends NewTransactionInput {
  raw: Record<string, string>;
  needsReview: boolean;
}

const amountFrom = (value: string) => Number(value.replace(/[¥￥,\s]/g, ''));
const cleanCell = (value: string | undefined | null) => (value ?? '').replace(/^\uFEFF/, '').replace(/\\t|\t/g, '').trim();
const isPresent = (value: string) => value !== '' && value !== '/' && value !== '-' && value !== '--';
const compact = (...parts: Array<string | undefined>) => {
  const seen = new Set<string>();
  return parts
    .map(cleanCell)
    .filter(isPresent)
    .filter((part) => {
      if (seen.has(part)) return false;
      seen.add(part);
      return true;
    })
    .join(' ');
};

export function parseBillText(source: ImportSource, text: string): ParsedImportRow[] {
  const tableText = extractTransactionTable(text);
  const parsed = Papa.parse<Record<string, string>>(tableText, {
    header: true,
    skipEmptyLines: 'greedy',
    transform: cleanCell,
    transformHeader: cleanCell
  });

  return parsed.data
    .filter((row) => Object.values(row).some((value) => cleanCell(value)))
    .map((row) => normalizeRow(source, row))
    .filter((row): row is ParsedImportRow => row !== null);
}

function extractTransactionTable(text: string) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const normalized = line.replace(/\s/g, '');
    const hasDate = /交易时间|交易创建时间|付款时间/.test(normalized);
    const hasOrder = /交易单号|交易订单号|交易号|商户单号/.test(normalized);
    return hasDate && hasOrder && normalized.includes('收/支') && normalized.includes('金额');
  });
  return headerIndex >= 0 ? lines.slice(headerIndex).join('\n') : text;
}

function normalizeRow(source: ImportSource, row: Record<string, string>): ParsedImportRow | null {
  const isWechat = source === 'wechat';
  const direction = cleanCell(row['收/支'] ?? row['收支'] ?? row['资金流向']);
  const type = typeFromDirection(direction);
  if (!type) return null;

  const amountText = row['金额(元)'] ?? row['金额'] ?? row['交易金额'] ?? '0';
  const amount = amountFrom(amountText);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (isFailedStatus(row)) return null;

  const occurredAtText = row['交易时间'] ?? row['交易创建时间'] ?? row['付款时间'] ?? '';
  const occurredAt = parseOccurredAt(occurredAtText);
  if (!occurredAt) return null;

  const externalKey = firstPresent(
    row['交易订单号'],
    row['交易单号'],
    row['交易号'],
    row['商户单号'],
    row['商家订单号']
  );
  const note = compact(row['交易对方'], row['商品'], row['商品说明']) || compact(row['交易分类'], row['交易类型']);

  return {
    type,
    amount,
    categoryId: type === 'income' ? guessIncomeCategory(row) : guessExpenseCategory(row),
    occurredAt,
    note,
    source: isWechat ? 'wechat_import' : 'alipay_import',
    paymentChannel: isWechat ? 'wechat' : 'alipay',
    externalKey,
    raw: row,
    needsReview: false
  };
}

function parseOccurredAt(value: string) {
  const trimmed = cleanCell(value);
  if (!trimmed) return null;
  const normalized = trimmed.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function typeFromDirection(direction: string) {
  if (direction.includes('收入') || direction === '收' || direction.includes('收款')) return 'income';
  if (direction.includes('支出') || direction === '支' || direction.includes('付款')) return 'expense';
  return null;
}

function firstPresent(...values: Array<string | undefined>) {
  const value = values.map(cleanCell).find(isPresent);
  return value ?? null;
}

function isFailedStatus(row: Record<string, string>) {
  const status = compact(row['交易状态'], row['当前状态']);
  return /失败|关闭|取消|撤销/.test(status);
}

function guessIncomeCategory(row: Record<string, string>) {
  const text = Object.values(row).join(' ');
  if (/工资|薪资|薪水/.test(text)) return 'income-salary';
  if (/奖金|奖/.test(text)) return 'income-bonus';
  if (/退款|退回/.test(text)) return 'income-refund';
  if (/转账|收款/.test(text)) return 'income-transfer';
  if (/理财|基金|股票|收益|分红|利息/.test(text)) return 'income-investment';
  return 'income-other';
}

function guessExpenseCategory(row: Record<string, string>) {
  const text = Object.values(row).join(' ');
  if (/亏损|理财亏|投资亏|基金亏|股票亏/.test(text)) return 'expense-investment-loss';
  if (/餐|饭|咖啡|奶茶|美团|饿了么|便利店|饮料|零食/.test(text)) return 'expense-food';
  if (/交通|地铁|公交|打车|滴滴|铁路|机票|哈啰|单车|骑行/.test(text)) return 'expense-transport';
  if (/房租|物业|水费|电费|燃气/.test(text)) return 'expense-housing';
  if (/药|医院|门诊/.test(text)) return 'expense-medical';
  if (/淘宝|京东|拼多多|购物|日用百货|无人零售|智能柜/.test(text)) return 'expense-shopping';
  return 'expense-other';
}
