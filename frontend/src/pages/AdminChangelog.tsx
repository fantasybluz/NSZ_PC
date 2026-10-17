// 後台的「更新紀錄」：點側欄最下面的版號進來
import React from 'react';

import AdminShell from '../components/AdminShell';
import { logoutAdmin } from '../lib/adminAuth';
import { CHANGELOG, UNRELEASED, splitBold } from '../lib/changelog';
import { APP_VERSION, BUILD_DATE, BUILD_SHA, versionSeen } from '../lib/version';

const Item: React.FC<{ text: string }> = ({ text }) => (
  <li>{splitBold(text).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}</li>
);

const AdminChangelog: React.FC = () => {
  // 看過更新紀錄，側欄的 NEW 就消失
  React.useEffect(() => {
    versionSeen.markSeen();
  }, []);

  return (
    <AdminShell active="changelog" onLogout={logoutAdmin}>
      <section className="section-card admin-changelog">
        <header className="admin-page-head">
          <div>
            <h1>更新紀錄</h1>
            <p>目前版本 v{APP_VERSION}{[BUILD_SHA && `・建置 ${BUILD_SHA}`, BUILD_DATE && `・${BUILD_DATE}`].filter(Boolean).join('')}</p>
          </div>
        </header>

        {CHANGELOG.map((section) => {
          const unreleased = section.version === UNRELEASED;
          return (
            <article key={section.version} className="admin-changelog-version">
              <h2>
                {unreleased ? '下一版' : `v${section.version}`}
                {section.version === APP_VERSION ? <span className="admin-changelog-tag">目前版本</span> : null}
                {unreleased ? <small>已經上線，還沒發版</small> : null}
              </h2>
              <ul>
                {section.items.map((item) => (
                  <Item key={item} text={item} />
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </AdminShell>
  );
};

export default AdminChangelog;
