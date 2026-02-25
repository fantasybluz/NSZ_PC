import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import {
  getApiBaseUrl,
  getStoredToken,
  storeAuth,
  toApiErrorMessage,
  type LoginResponse,
} from '../lib/adminAuth';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  if (getStoredToken()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('請輸入帳號和密碼');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const payload = (await response.json()) as LoginResponse | unknown;

      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '登入失敗'));
      }

      const data = (payload as LoginResponse).data;
      if (!data?.token || !data.user) {
        throw new Error('登入回應格式不正確');
      }

      storeAuth(data.token, data.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '系統錯誤，請稍後再試';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="section-card auth-card reveal">
        <p className="section-kicker">Admin Access</p>
        <h1 className="section-title">後台登入</h1>
        <p className="section-sub">使用後台管理員帳號登入，管理商品、分類與出貨資訊。</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field" htmlFor="admin-username">
            帳號
            <input
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="請輸入管理員帳號"
            />
          </label>

          <label className="auth-field" htmlFor="admin-password">
            密碼
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="請輸入密碼"
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="solid-btn auth-submit" disabled={isLoading}>
            {isLoading ? '登入中...' : '登入後台'}
          </button>
        </form>

        <p className="auth-tip">
          API 位置：<code>{getApiBaseUrl()}</code>
        </p>

        <Link to="/" className="text-link">
          回到首頁
          <i className="fa-solid fa-arrow-right" />
        </Link>
      </section>
    </div>
  );
};

export default AdminLogin;
