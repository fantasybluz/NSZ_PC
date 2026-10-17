// 官網後台的外框：左邊固定的導覽（手機變成上方可橫向捲動的分頁），右邊是內容。
// 後台首頁的四個分頁用網址的 #hash 記住（重新整理、分享連結都會停在同一頁），技術文章是獨立頁面。

import React from 'react';
import { Link } from 'react-router-dom';

import { ADMIN_LOGOUT_URL, INTERNAL_SYSTEM_URL } from '../lib/adminAuth';
import { APP_VERSION, versionSeen } from '../lib/version';
import type { AdminTabKey } from '../pages/adminDashboard/shared';

export type AdminSection = AdminTabKey | 'blog' | 'changelog';

// 「更新紀錄」不在選單裡（點側欄最下面的版號進去）
const NAV: Array<{ key: AdminTabKey | 'blog'; label: string; icon: string; hint: string }> = [
  { key: 'orders', label: '出機紀錄', icon: 'fa-solid fa-truck-fast', hint: '官網上的出機案例' },
  { key: 'builds', label: '推薦配單', icon: 'fa-solid fa-desktop', hint: '首頁的推薦配單' },
  { key: 'categories', label: '分類總覽', icon: 'fa-solid fa-layer-group', hint: '分類介紹頁' },
  { key: 'blog', label: '技術文章', icon: 'fa-solid fa-newspaper', hint: '文章與影片' },
  { key: 'siteContent', label: '網站文字', icon: 'fa-solid fa-pen-to-square', hint: '首頁標語、流程、聯絡方式' },
];

interface AdminShellProps {
  active: AdminSection;
  /** 在後台首頁時切分頁；沒給（例如在技術文章頁）就用連結回後台首頁 */
  onSelect?: (key: AdminTabKey) => void;
  email?: string;
  onLogout: () => void;
  children: React.ReactNode;
}

const AdminShell: React.FC<AdminShellProps> = ({ active, onSelect, email, onLogout, children }) => {
  const navRef = React.useRef<HTMLElement>(null);
  // 有沒看過的新版就在版號旁邊顯示 NEW
  const unseen = React.useSyncExternalStore(versionSeen.subscribe, versionSeen.hasUnseen);

  // 手機上分頁是一排橫向捲動，目前這頁要捲到看得到
  React.useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  return (
    <div className="admin-shell">
      <aside className="admin-side" aria-label="後台選單">
        <Link to="/admin" className="admin-side-brand" onClick={() => onSelect?.('orders')}>
          <img src="/images/NSZ_LOGO.png" alt="" />
          <span>
            <strong>官網後台</strong>
            <small>nszpc.bluz.dev</small>
          </span>
        </Link>

        <nav className="admin-side-nav" ref={navRef}>
          {NAV.map((item) => {
            const className = `admin-side-link ${active === item.key ? 'active' : ''}`;
            const body = (
              <>
                <i className={item.icon} aria-hidden="true" />
                <span>
                  {item.label}
                  <small>{item.hint}</small>
                </span>
              </>
            );
            if (item.key === 'blog') {
              return (
                <Link key={item.key} to="/admin/blog" className={className} aria-current={active === item.key ? 'page' : undefined}>
                  {body}
                </Link>
              );
            }
            const tab = item.key;
            return onSelect ? (
              <button key={tab} type="button" className={className} aria-current={active === tab ? 'page' : undefined} onClick={() => onSelect(tab)}>
                {body}
              </button>
            ) : (
              <Link key={tab} to={`/admin#${tab}`} className={className}>
                {body}
              </Link>
            );
          })}
        </nav>

        <div className="admin-side-links">
          {/* 庫存、訂單、報價單、檢測表在 DPOM（星辰電腦內部管理系統） */}
          <a href={INTERNAL_SYSTEM_URL} target="_blank" rel="noopener noreferrer">
            <i className="fa-solid fa-boxes-stacked" aria-hidden="true" />
            內部管理系統
            <i className="fa-solid fa-arrow-up-right-from-square admin-ext" aria-hidden="true" />
          </a>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <i className="fa-solid fa-globe" aria-hidden="true" />
            查看官網
            <i className="fa-solid fa-arrow-up-right-from-square admin-ext" aria-hidden="true" />
          </a>
        </div>

        <div className="admin-side-foot">
          {email ? <p title={email}>{email}</p> : null}
          <Link to="/admin/changelog" className="admin-side-version" title="看更新紀錄">
            v{APP_VERSION}
            {unseen ? <span className="admin-side-version-new">NEW</span> : null}
          </Link>
          <div>
            <a href={ADMIN_LOGOUT_URL}>切換帳號</a>
            <button type="button" onClick={onLogout}>登出</button>
          </div>
        </div>
      </aside>

      <div className="admin-main">{children}</div>
    </div>
  );
};

export default AdminShell;
