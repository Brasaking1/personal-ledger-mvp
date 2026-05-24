import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionForm } from './TransactionForm';

describe('TransactionForm', () => {
  it('submits an expense with amount, category, date, and note', async () => {
    const onSubmit = vi.fn();
    render(
      <TransactionForm
        categories={[
          {
            id: 'food',
            userId: 'u',
            name: '餐饮',
            type: 'expense',
            color: '#000',
            icon: 'utensils',
            isSystem: true,
            sortOrder: 1,
            createdAt: '',
            updatedAt: ''
          }
        ]}
        defaultType="expense"
        onSubmit={onSubmit}
      />
    );

    await userEvent.type(screen.getByLabelText('金额'), '45.8');
    await userEvent.type(screen.getByLabelText('备注'), '晚饭');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 45.8, note: '晚饭', type: 'expense' }));
  });
});
