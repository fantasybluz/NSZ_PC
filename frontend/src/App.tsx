import './App.css';

import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

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
      ogImage: '/images/NSZ_LOGO.png',
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
      <div className="app-shell">
        <RouteSeoDefaults />
        <Menu />

        <main className="page-wrap">
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
        </main>

        <footer className="site-footer">
          <div>
            <strong>NSZPC 星辰電腦</strong>
            <span>{siteContent.footerAddress}</span>
          </div>
          <p>{siteContent.footerSlogan}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
