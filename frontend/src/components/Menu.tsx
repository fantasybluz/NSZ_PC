import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

// Apple 式的全站導覽：44px 半透明細條、12px 小字連結（參考 apple.com/tw/mac）。
// 給客人看的頁面不放後台的連結（從 DPOM 的側欄或直接打 /admin 進去）。
const NAV_ITEMS: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: '首頁', end: true },
  { to: '/orders/tags', label: '出機紀錄' },
  { to: '/categories', label: '分類總覽' },
  { to: '/blog', label: '技術文章' },
  { to: '/#contact', label: '聯絡我們' },
];

const Menu: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  const links = NAV_ITEMS.map((item) =>
    item.to.includes('#') ? (
      <Link key={item.to} to={item.to} className="menu-link">
        {item.label}
      </Link>
    ) : (
      <NavLink key={item.to} to={item.to} end={item.end} className="menu-link">
        {item.label}
      </NavLink>
    ),
  );

  return (
    <header className={`site-header ${mobileOpen ? 'open' : ''}`}>
      <div className="header-inner">
        <Link className="brand-block" to="/" aria-label="星辰電腦 NSZPC 首頁">
          <img src="/images/NSZ_LOGO.png" alt="" className="brand-logo" />
          <span className="brand-name">星辰電腦</span>
        </Link>

        <nav className="desktop-nav" aria-label="主選單">
          {links}
        </nav>

        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? '關閉選單' : '打開選單'}
        >
          <span />
          <span />
        </button>
      </div>

      {mobileOpen ? (
        <nav className="mobile-nav" aria-label="行動版選單">
          {links}
        </nav>
      ) : null}
    </header>
  );
};

export default Menu;
