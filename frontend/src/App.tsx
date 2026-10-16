import './App.css';
// Apple 風格（DESIGN.md）疊在最上面
import './styles/apple.css';
// 前台的 Apple 版面（滿版區塊、橫向卡片列；參考 apple.com/tw/mac）
import './styles/apple-site.css';

import React from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Menu from './components/Menu';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import Home from './pages/Home';
import BuildDetail from './pages/BuildDetail';
import OrderDetail from './pages/OrderDetail';
import OrderTagOverview from './pages/OrderTagOverview';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminBlogManager from './pages/AdminBlogManager';
import {
  defaultPublicSiteContent,
  fetchPublicSiteContent,
  type PublicSiteContent,
} from './lib/publicSiteContent';
import { applySeo } from './lib/seo';

const RouteSeoDefaults: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.startsWith('/blog')) {
      return;
    }

    const isAdminPath = location.pathname.startsWith('/admin');

    applySeo({
      title: 'NSZPC 星辰電腦｜客製化主機與近期出貨紀錄',
      description:
        'NSZPC 提供客製化主機配單、近期出貨案例與需求導向的硬體建議，協助你快速找到合適配置。',
      keywords: ['客製化主機', '電腦組裝', '近期出貨', '配單建議', 'NSZPC'],
      canonicalPath: location.pathname || '/',
      ogType: 'website',
      ogImage: '/og-image.jpg',
      noindex: isAdminPath,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'NSZPC 星辰電腦',
        url: window.location.origin,
        inLanguage: 'zh-Hant',
      },
      jsonLdId: 'page-seo',
    });
  }, [location.pathname]);

  return null;
};

// 後台（登入頁以外）有自己的側邊選單，不顯示官網的頂欄和 footer
const AppFrame: React.FC<{ siteContent: PublicSiteContent; children: React.ReactNode }> = ({ siteContent, children }) => {
  const { pathname, hash } = useLocation();
  const isAdmin = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

  // 換頁回到最上面；有 #（例如 /#contact）就捲到那一段。後台的分頁自己處理 #
  React.useEffect(() => {
    if (isAdmin) return;
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const timer = window.setTimeout(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [pathname, hash, isAdmin]);

  if (isAdmin) {
    return <main className="admin-wrap">{children}</main>;
  }

  return (
    <div className="app-shell">
      <Menu />

      <main className="page-wrap">{children}</main>

      {/* Apple 式的 footer：分欄的連結、最下面一行版權；後台登入放在這裡 */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-cols">
            <nav aria-label="探索">
              <h2>探索</h2>
              <Link to="/#builds">推薦配單</Link>
              <Link to="/orders/tags">出機紀錄</Link>
              <Link to="/categories">分類總覽</Link>
              <Link to="/blog">技術文章</Link>
            </nav>
            <nav aria-label="聯絡星辰">
              <h2>聯絡星辰</h2>
              {siteContent.contactChannels.map((channel) => (
                <a key={channel.label} href={channel.href} target="_blank" rel="noreferrer">
                  {channel.label}
                </a>
              ))}
            </nav>
            <div>
              <h2>門市</h2>
              <p>{siteContent.footerAddress}</p>
              <p>{siteContent.footerSlogan}</p>
            </div>
          </div>
          <div className="footer-legal">
            <span>Copyright © {new Date().getFullYear()} 星辰電腦 NSZPC。保留一切權利。</span>
            <a href="/admin">後台登入</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  const [siteContent, setSiteContent] = React.useState(defaultPublicSiteContent);

  React.useEffect(() => {
    const loadSiteContent = async () => {
      const next = await fetchPublicSiteContent();
      setSiteContent(next);
    };

    loadSiteContent().catch(() => {
      // Keep fallback site content when backend request fails.
    });
  }, []);

  return (
    <Router>
      <RouteSeoDefaults />
      <AppFrame siteContent={siteContent}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/brand" element={<Navigate to="/categories" replace />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/item/:id" element={<CategoryDetail />} />
          <Route path="/builds/item/:id" element={<BuildDetail />} />
          <Route path="/orders/tags" element={<OrderTagOverview />} />
          <Route path="/orders/item/:id" element={<OrderDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/blog" element={<AdminBlogManager />} />

          <Route path="/cases/*" element={<Navigate to="/categories#case-portfolio" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppFrame>
    </Router>
  );
}

export default App;
