import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthGate } from './AuthGate';

describe('AuthGate', () => {
  it('asks for an email when cloud sync is enabled and no user is present', async () => {
    const onLogin = vi.fn();
    render(<AuthGate mode="cloud" userEmail={null} onLogin={onLogin} onLogout={() => undefined}>content</AuthGate>);

    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com');
    await userEvent.click(screen.getByRole('button', { name: '发送登录链接' }));

    expect(onLogin).toHaveBeenCalledWith('me@example.com');
  });
});
