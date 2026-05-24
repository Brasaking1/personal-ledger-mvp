import { useState, type ReactNode } from 'react';

export function AuthGate({
  mode,
  userEmail,
  onLogin,
  onLogout,
  children
}: {
  mode: 'local' | 'cloud';
  userEmail: string | null;
  onLogin: (email: string) => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  if (mode === 'local') {
    return <>{children}</>;
  }

  if (userEmail) {
    return (
      <>
        <div className="auth-strip">
          <span>{userEmail}</span>
          <button type="button" onClick={() => void onLogout()}>退出</button>
        </div>
        {children}
      </>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onLogin(email);
    setMessage('登录链接已发送');
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">我的账本</p>
          <h1>登录</h1>
        </div>
        <label>
          <span>邮箱</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button className="submit-button" type="submit">发送登录链接</button>
        {message && <p className="sync-line">{message}</p>}
      </form>
    </main>
  );
}
