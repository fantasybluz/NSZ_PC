import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const Menu: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand-block" to="/">
          <img src="/images/NSZ_LOGO.png" alt="NSZPC" className="brand-logo" />
          <div className="brand-text">
            <strong>NSZPC</strong>
            <span>Custom Build Studio</span>
          </div>
        </Link>

        <nav className="desktop-nav" aria-label="主選單">
          <NavLink to="/" className="menu-link">
            首頁
          </NavLink>
          <NavLink to="/blog" className="menu-link">
            技術文章
          </NavLink>
          <NavLink to="/categories" className="menu-link">
            分類總覽
          </NavLink>
          <NavLink to="/admin/login" className="menu-link">
            後台登入
          </NavLink>
        </nav>

        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="切換選單"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileOpen ? (
        <div className="mobile-nav" aria-label="行動版選單">
          <NavLink to="/" className="menu-link">
            首頁
          </NavLink>
          <NavLink to="/blog" className="menu-link">
            技術文章
          </NavLink>
          <NavLink to="/categories" className="menu-link">
            分類總覽
          </NavLink>
          <NavLink to="/admin/login" className="menu-link">
            後台登入
          </NavLink>
        </div>
      ) : null}
    </header>
  );
};

export default Menu;
