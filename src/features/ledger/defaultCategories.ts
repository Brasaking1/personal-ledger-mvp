import type { Category, TransactionType } from '../../types/ledger';

const now = () => new Date().toISOString();

const category = (
  id: string,
  name: string,
  type: TransactionType,
  color: string,
  icon: string,
  sortOrder: number
): Category => ({
  id,
  userId: 'system',
  name,
  type,
  color,
  icon,
  isSystem: true,
  sortOrder,
  createdAt: now(),
  updatedAt: now()
});

export const defaultCategories: Category[] = [
  category('expense-food', '餐饮', 'expense', '#ea580c', 'utensils', 1),
  category('expense-transport', '交通', 'expense', '#2563eb', 'bus', 2),
  category('expense-shopping', '购物', 'expense', '#db2777', 'shopping-bag', 3),
  category('expense-housing', '住房', 'expense', '#7c3aed', 'home', 4),
  category('expense-utilities', '生活缴费', 'expense', '#0891b2', 'receipt', 5),
  category('expense-entertainment', '娱乐', 'expense', '#16a34a', 'music', 6),
  category('expense-medical', '医疗', 'expense', '#dc2626', 'heart-pulse', 7),
  category('expense-study', '学习', 'expense', '#ca8a04', 'book-open', 8),
  category('expense-travel', '旅行', 'expense', '#0f766e', 'plane', 9),
  category('expense-other', '其他支出', 'expense', '#6b7280', 'circle-ellipsis', 10),
  category('income-salary', '工资', 'income', '#059669', 'wallet', 1),
  category('income-bonus', '奖金', 'income', '#65a30d', 'gift', 2),
  category('income-parttime', '兼职', 'income', '#0d9488', 'briefcase', 3),
  category('income-refund', '退款', 'income', '#0284c7', 'rotate-ccw', 4),
  category('income-transfer', '转账', 'income', '#4f46e5', 'repeat', 5),
  category('income-investment', '投资收益', 'income', '#9333ea', 'trending-up', 6),
  category('income-other', '其他收入', 'income', '#6b7280', 'circle-ellipsis', 7)
];
