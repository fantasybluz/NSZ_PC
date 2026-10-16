import React from 'react';
import { Link } from 'react-router-dom';

// 後台登入交給 Cloudflare Access：整頁跳到 /admin，Cloudflare 會先要求登入（只放行指定的 email），
// 登入後再回到後台。網站本身不再有帳號密碼。
const AdminLogin: React.FC = () => {
  React.useEffect(() => {
    window.location.replace('/admin');
  }, []);

  return (
    <div className="auth-page">
      <section className="section-card auth-card reveal">
        <p className="section-kicker">Admin Access</p>
        <h1 className="section-title">後台登入</h1>
        <p className="section-sub">正在前往登入頁面，請用管理員的 email 登入。</p>

        <a href="/admin" className="solid-btn auth-submit">
          前往後台
        </a>

        <Link to="/" className="text-link">
          回到首頁
          <i className="fa-solid fa-arrow-right" />
        </Link>
      </section>
    </div>
  );
};

export default AdminLogin;
