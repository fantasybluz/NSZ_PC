import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import {
  fallbackPublicBuilds,
  fetchPublicBuilds,
  normalizeYouTubeEmbedUrl,
  type PublicBuild,
} from '../lib/publicBuilds';

const BuildDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const decodedId = React.useMemo(() => {
    if (!id) {
      return '';
    }

    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [id]);

  const [builds, setBuilds] = React.useState<PublicBuild[]>(fallbackPublicBuilds);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadBuilds = async () => {
      const next = await fetchPublicBuilds();
      setBuilds(next);
      setIsLoading(false);
    };

    loadBuilds().catch(() => {
      setIsLoading(false);
    });
  }, []);

  if (!decodedId) {
    return <Navigate to="/" replace />;
  }

  const build = builds.find((item) => item.id === decodedId);

  if (!build && !isLoading) {
    return <Navigate to="/" replace />;
  }

  if (!build) {
    return (
      <div className="page build-detail-page">
        <section className="section-card reveal">
          <p className="admin-note">讀取配單內容中...</p>
        </section>
      </div>
    );
  }

  const embedUrl = normalizeYouTubeEmbedUrl(build.youtubeEmbedUrl || '');

  return (
    <div className="page build-detail-page">
      <section className="page-hero reveal category-detail-hero">
        <div>
          <p className="section-kicker">Build Detail</p>
          <h1>{build.name}</h1>
          <p>{build.description}</p>
          <div className="hero-actions">
            <Link to="/" className="solid-btn">
              回首頁
            </Link>
            <Link to="/categories" className="ghost-btn">
              看分類總覽
            </Link>
          </div>
        </div>

        <div className="category-detail-media">
          <img src={build.image} alt={build.name} loading="lazy" />
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Overview</p>
          <h2 className="section-title">電腦介紹</h2>
        </div>
        <p>{build.detailIntro || build.description}</p>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Requirements</p>
          <h2 className="section-title">需求說明</h2>
        </div>
        <p>{build.requirementIntro}</p>

        {build.specs.length > 0 ? (
          <ul className="detail-list">
            {build.specs.map((spec) => (
              <li key={`${build.id}-${spec}`}>{spec}</li>
            ))}
          </ul>
        ) : null}

        {build.accessories.length > 0 ? (
          <>
            <h3 className="section-title">配件</h3>
            <ul className="detail-list">
              {build.accessories.map((item) => (
                <li key={`${build.id}-${item}`}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Core Parts</p>
          <h2 className="section-title">核心配備</h2>
        </div>

        <div className="detail-card-grid build-core-list">
          <article className="detail-card-item">
            <i className="fa-solid fa-microchip" aria-hidden="true" />
            <p>CPU：{build.cpu || '未標示'}</p>
          </article>
          <article className="detail-card-item">
            <i className="fa-solid fa-network-wired" aria-hidden="true" />
            <p>主機板：{build.motherboard || '未標示'}</p>
          </article>
          <article className="detail-card-item">
            <i className="fa-solid fa-memory" aria-hidden="true" />
            <p>RAM：{build.ram || '未標示'}</p>
          </article>
          <article className="detail-card-item">
            <i className="fa-solid fa-hard-drive" aria-hidden="true" />
            <p>硬碟：{build.storage || '未標示'}</p>
          </article>
          <article className="detail-card-item">
            <i className="fa-solid fa-tv" aria-hidden="true" />
            <p>顯示卡：{build.gpu || '未標示'}</p>
          </article>
          <article className="detail-card-item">
            <i className="fa-solid fa-bolt" aria-hidden="true" />
            <p>電源供應器：{build.psu || '未標示'}</p>
          </article>
          <article className="detail-card-item">
            <i className="fa-solid fa-box-open" aria-hidden="true" />
            <p>機殼：{build.pcCase || '未標示'}</p>
          </article>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="build-price-row">
          <div className="build-price-item">
            <strong>參考價格</strong>
            <span>NT$ {build.price.toLocaleString('zh-TW')}</span>
          </div>
          <div className="build-price-item">
            <strong>成交日期</strong>
            <span>{build.dealDate || '未標示'}</span>
          </div>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Video</p>
          <h2 className="section-title">YouTube 介紹影片</h2>
        </div>

        {embedUrl ? (
          <div className="build-video-frame">
            <iframe
              src={embedUrl}
              title={`${build.name} YouTube 介紹影片`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="build-video-placeholder">
            <p>尚未設定影片。可在後台的推薦配單欄位填入 YouTube 連結（watch/share/embed）。</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BuildDetail;
