import React from 'react';
import { Link } from 'react-router-dom';

import Shelf from '../components/Shelf';
import { carouselImages } from '../data/siteData';
import {
  fallbackPublicBuilds,
  fetchPublicBuilds,
  getBuildDetailPath,
  type PublicBuild,
} from '../lib/publicBuilds';
import {
  fallbackPublicOrders,
  fetchPublicOrders,
  getOrderTagOverviewPath,
  type PublicOrder,
} from '../lib/publicOrders';
import {
  fallbackPublicCategories,
  fetchPublicCategories,
  getCategoryDetailPath,
  type PublicCategory,
} from '../lib/publicCategories';
import {
  defaultPublicSiteContent,
  fetchPublicSiteContent,
} from '../lib/publicSiteContent';

const currencyFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0,
});

const formatCurrency = (value?: number): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return currencyFormatter.format(value as number);
};

const statusLabelMap: Record<PublicOrder['status'], string> = {
  pending: '待處理',
  shipping: '出貨中',
  delivered: '已送達',
  cancelled: '已取消',
};

const Home: React.FC = () => {
  const [builds, setBuilds] = React.useState<PublicBuild[]>(fallbackPublicBuilds);
  const [recentOrders, setRecentOrders] = React.useState<PublicOrder[]>(fallbackPublicOrders);
  const [siteContent, setSiteContent] = React.useState(defaultPublicSiteContent);
  const [activeOrder, setActiveOrder] = React.useState<PublicOrder | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);
  const [categories, setCategories] = React.useState<PublicCategory[]>(fallbackPublicCategories);

  React.useEffect(() => {
    fetchPublicCategories()
      .then(setCategories)
      .catch(() => {
        // Keep fallback categories when backend request fails.
      });
  }, []);

  React.useEffect(() => {
    setActiveSlideIndex(0);
  }, [activeOrder?.id]);

  React.useEffect(() => {
    const loadBuilds = async () => {
      const next = await fetchPublicBuilds();
      setBuilds(next);
    };

    loadBuilds().catch(() => {
      // Keep fallback builds when backend request fails.
    });
  }, []);

  React.useEffect(() => {
    const loadOrders = async () => {
      const next = await fetchPublicOrders(12);
      setRecentOrders(next);
    };

    loadOrders().catch(() => {
      // Keep fallback recent orders when backend request fails.
    });
  }, []);

  React.useEffect(() => {
    const loadSiteContent = async () => {
      const next = await fetchPublicSiteContent();
      setSiteContent(next);
    };

    loadSiteContent().catch(() => {
      // Keep fallback site content when backend request fails.
    });
  }, []);

  // 「LINE 詢問」用聯絡管道裡的 LINE，沒有就跳到聯絡我們
  const lineChannel = siteContent.contactChannels.find((channel) => /line/i.test(channel.label));
  const orderImage = (order: PublicOrder, index: number): string =>
    order.images[0] || carouselImages[(index * 3) % carouselImages.length];

  // 版面參考 apple.com/tw/mac：大標＋分類列 → 推薦配單（橫向卡片）→ 近期出機（直式照片卡）
  // → 跟星辰買電腦（服務流程）→ 客戶回饋 → 聯絡我們
  return (
    <div className="page home-page">
      <section className="tile tile-white store-hero">
        <div className="tile-inner">
          <h1 className="store-hero-title">星辰電腦</h1>
          <p className="store-hero-lead">{siteContent.homeHeroTitle}</p>
          <nav className="category-strip" aria-label="依用途找主機">
            {categories.map((category, index) => (
              <Link key={category.id} to={getCategoryDetailPath(category.id)} className="category-strip-item">
                <img src={category.detailHeroImage || carouselImages[index % carouselImages.length]} alt="" loading="lazy" />
                <span>{category.title}</span>
              </Link>
            ))}
            <Link to="/categories" className="category-strip-item">
              <span className="category-strip-more" aria-hidden="true">
                <i className="fa-solid fa-ellipsis" />
              </span>
              <span>全部分類</span>
            </Link>
          </nav>
        </div>
      </section>

      <section className="tile tile-parchment" id="builds">
        <div className="tile-inner">
          <header className="tile-head">
            <h2>探索推薦配單</h2>
          </header>
          <Shelf label="推薦配單">
            {builds.map((build) => (
              <article key={build.id} className="build-shelf-card">
                <Link to={getBuildDetailPath(build.id)} className="build-shelf-media" aria-label={`看 ${build.name}`}>
                  {build.badge ? <span className="build-shelf-badge">{build.badge}</span> : null}
                  <img src={build.image} alt={build.name} loading="lazy" />
                </Link>
                <div className="build-shelf-body">
                  <h3>{build.name}</h3>
                  <p>{build.description}</p>
                  <span className="build-shelf-price">NT${build.price.toLocaleString('zh-TW')} 起</span>
                  <div className="build-shelf-actions">
                    <Link to={getBuildDetailPath(build.id)} className="pill">
                      進一步了解
                    </Link>
                    <a href={lineChannel?.href || '#contact'} className="chevron-link" target={lineChannel ? '_blank' : undefined} rel="noreferrer">
                      LINE 詢問
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </Shelf>
        </div>
      </section>

      <section className="tile tile-white" id="recent-shipment">
        <div className="tile-inner">
          <header className="tile-head tile-head-split">
            <h2>{siteContent.brandHeroTitle || '近期出機'}</h2>
            <Link to="/orders/tags" className="chevron-link">
              看全部出機紀錄
            </Link>
          </header>
          <Shelf label="近期出機">
            {recentOrders.slice(0, 8).map((order, index) => (
              <button
                key={order.id}
                type="button"
                className={`story-card ${index % 3 === 1 ? 'story-card-dark' : ''}`}
                onClick={() => setActiveOrder(order)}
                aria-label={`查看 ${order.item} 的配備`}
              >
                <span className="story-card-eyebrow">
                  {order.date}・{order.location}
                </span>
                <span className="story-card-title">{order.item}</span>
                <img src={orderImage(order, index)} alt="" loading="lazy" />
                <span className="story-card-plus" aria-hidden="true">
                  <i className="fa-solid fa-plus" />
                </span>
              </button>
            ))}
          </Shelf>
        </div>
      </section>

      <section className="tile tile-parchment">
        <div className="tile-inner">
          <header className="tile-head">
            <h2>跟星辰買電腦，最好。</h2>
          </header>
          <div className="stat-strip">
            {siteContent.homeStats.map((item, index) => (
              <div key={`${item.value}-${index}`}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <Shelf label="服務流程">
            {siteContent.shippingSteps.map((step, index) => (
              <article key={step.title} className="info-card">
                <span className="info-card-eyebrow">步驟 {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </Shelf>
        </div>
      </section>

      <section className="tile tile-white">
        <div className="tile-inner">
          <header className="tile-head">
            <h2>客戶怎麼說</h2>
          </header>
          <div className="quote-grid">
            {siteContent.testimonials.map((testimonial) => (
              <figure key={testimonial.name} className="quote-card">
                <blockquote>「{testimonial.quote}」</blockquote>
                <figcaption>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.tag}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="tile tile-parchment" id="contact">
        <div className="tile-inner">
          <header className="tile-head">
            <h2>聯絡我們</h2>
          </header>
          <div className="duo-grid">
            <article className="duo-card">
              <h3>線上詢問</h3>
              <p>{siteContent.homeContactSubtitle}</p>
              <ul className="contact-rows">
                {siteContent.contactChannels.map((channel) => (
                  <li key={channel.label}>
                    <a href={channel.href} target="_blank" rel="noreferrer">
                      <i className={channel.icon} aria-hidden="true" />
                      <span>{channel.label}</span>
                      <strong>{channel.value}</strong>
                    </a>
                  </li>
                ))}
              </ul>
            </article>
            <article className="duo-card duo-card-media">
              <div className="duo-card-text">
                <h3>到店諮詢</h3>
                <p>{siteContent.footerAddress}</p>
                <a
                  className="chevron-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteContent.footerAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  在 Google 地圖開啟
                </a>
              </div>
              <iframe
                title="星辰電腦地圖"
                src={`https://www.google.com/maps?q=${encodeURIComponent(siteContent.footerAddress)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </article>
          </div>
        </div>
      </section>

      {activeOrder ? (
        <div className="order-modal-overlay" onClick={() => setActiveOrder(null)}>
          {(() => {
            const fallbackImages = carouselImages.slice(0, 5);
            const images = activeOrder.images.length > 0 ? activeOrder.images : fallbackImages;
            const safeIndex = Math.min(activeSlideIndex, Math.max(images.length - 1, 0));
            const handlePrev = () =>
              setActiveSlideIndex((prev) => (prev - 1 + images.length) % images.length);
            const handleNext = () =>
              setActiveSlideIndex((prev) => (prev + 1) % images.length);

            return (
              <section
                className="order-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="order-modal-head">
                  <div>
                    <h3 id="order-modal-title">{activeOrder.item}</h3>
                  </div>
                  <button type="button" className="admin-modal-close" onClick={() => setActiveOrder(null)}>
                    關閉
                  </button>
                </div>

                <div className="order-modal-gallery">
                  <img src={images[safeIndex]} alt={activeOrder.item} className="order-modal-image" />
                  {images.length > 1 ? (
                    <div className="order-modal-gallery-controls">
                      <button type="button" onClick={handlePrev} aria-label="上一張">
                        ‹
                      </button>
                      <span>
                        {safeIndex + 1} / {images.length}
                      </span>
                      <button type="button" onClick={handleNext} aria-label="下一張">
                        ›
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="order-modal-meta">
                  <span>出貨日期：{activeOrder.date}</span>
                  <span>交機地區：{activeOrder.location}</span>
                  <span className={`order-status-badge ${activeOrder.status}`}>
                    {statusLabelMap[activeOrder.status]}
                  </span>
                </div>

                {activeOrder.tags.length > 0 ? (
                  <div className="tag-cloud order-modal-tags">
                    {activeOrder.tags.map((tag) => (
                      <Link
                        key={`drawer-${activeOrder.id}-${tag}`}
                        to={getOrderTagOverviewPath(tag)}
                        className="tag-pill"
                        onClick={() => setActiveOrder(null)}
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                ) : null}

                <div className="order-modal-section">
                  <p className="section-kicker">需求說明</p>
                  <p className="order-modal-text">{activeOrder.requirementIntro}</p>
                </div>

                <div className="order-modal-section">
                  <p className="section-kicker">核心配備</p>
                  <ul className="shipment-core-specs order-modal-list">
                    {(
                      [
                        ['CPU', activeOrder.cpu],
                        ['主機板', activeOrder.motherboard],
                        ['RAM', activeOrder.ram],
                        ['硬碟', activeOrder.storage],
                        ['顯示卡', activeOrder.gpu],
                        ['散熱器', activeOrder.cooler],
                        ['電源', activeOrder.psu],
                        ['機殼', activeOrder.pcCase],
                      ] as const
                    )
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <li key={label}>
                          {label}：{value}
                        </li>
                      ))}
                  </ul>
                </div>

                {Number.isFinite(activeOrder.salePrice) && (
                  <div className="order-modal-price">
                    <p>售價(含稅)：{formatCurrency(activeOrder.salePrice)}</p>
                  </div>
                )}
              </section>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
};

export default Home;
