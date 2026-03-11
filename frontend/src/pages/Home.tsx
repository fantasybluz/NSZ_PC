import React from 'react';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
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
    return '待補充';
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

  return (
    <div className="page home-page">
      <section className="hero-panel reveal">
        <div className="hero-copy">
          <p className="section-kicker">{siteContent.homeHeroKicker}</p>
          <h1>{siteContent.homeHeroTitle}</h1>
          <p>{siteContent.homeHeroSubtitle}</p>
          <div className="hero-actions">
            <Link to="/categories" className="solid-btn">
              查看分類總覽
            </Link>
            <Link to="/orders/tags" className="ghost-btn">
              查看訂單管理
            </Link>
          </div>
        </div>

        <div className="stat-grid">
          {siteContent.homeStats.map((item, index) => (
            <article key={`${item.value}-${item.label}-${index}`} className="stat-card">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

            <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Customer Voice</p>
          <h2 className="section-title">客戶回饋</h2>
        </div>

        <div className="testimonial-grid">
          {siteContent.testimonials.map((testimonial) => (
            <article key={testimonial.name} className="testimonial-card">
              <p>“{testimonial.quote}”</p>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.tag}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Ready Packages</p>
          <h2 className="section-title">本月推薦配單</h2>
          <p className="section-sub">{siteContent.homeBuildSubtitle}</p>
        </div>

        <div className="build-grid">
          {builds.slice(0, 3).map((build) => (
            <ProductCard
              key={build.id}
              name={build.name}
              image={build.image}
              description={build.description}
              price={build.price}
              dealDate={build.dealDate}
              badge={build.badge}
              detailPath={getBuildDetailPath(build.id)}
            />
          ))}
        </div>
      </section>

      <section className="section-card reveal" id="recent-shipment">
        <div className="section-head">
          <p className="section-kicker">Recent Shipment</p>
          <h2 className="section-title">{siteContent.brandHeroTitle || '訂單管理'}</h2>
          <p className="section-sub">{siteContent.brandHeroSubtitle || '依近期實際出機案例整理，包含需求重點與配備說明。'}</p>
        </div>

        <div className="shipment-list">
          {recentOrders.slice(0, 6).map((order) => (
            <article
              key={order.id}
              className="shipment-item shipment-item-compact"
              role="button"
              tabIndex={0}
              onClick={() => setActiveOrder(order)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveOrder(order);
                }
              }}
              aria-label={`查看 ${order.item} 詳細資訊`}
            >
              <strong>{order.date}</strong>
              <p>需求：{order.item}</p>
              {order.tags.length > 0 ? (
                <div className="tag-cloud shipment-tags">
                  {order.tags.map((tag) => (
                    <Link
                      key={`${order.id}-${tag}`}
                      to={getOrderTagOverviewPath(tag)}
                      className="tag-pill"
                      onClick={(event) => event.stopPropagation()}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              ) : null}
              <span>交機地區：{order.location}</span>
              <span className="shipment-item-cta">點擊查看詳細</span>
            </article>
          ))}
        </div>
        <Link to="/orders/tags" className="text-link">
          看更多出機紀錄
          <i className="fa-solid fa-arrow-right" />
        </Link>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Workflow</p>
          <h2 className="section-title">出貨流程</h2>
          <p className="section-sub">{siteContent.homeWorkflowSubtitle}</p>
        </div>

        <div className="process-grid">
          {siteContent.shippingSteps.map((step, idx) => (
            <article key={step.title} className="process-step">
              <span>{String(idx + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>



      <section className="section-card reveal">
        <div className="contact-grid">
          <article className="contact-panel">
            <p className="section-kicker">Contact</p>
            <h2 className="section-title">聯絡我們</h2>
            <p className="section-sub">{siteContent.homeContactSubtitle}</p>

            <div className="contact-list">
              {siteContent.contactChannels.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-link"
                >
                  <i className={channel.icon} aria-hidden="true" />
                  <div>
                    <span>{channel.label}</span>
                    <strong>{channel.value}</strong>
                  </div>
                </a>
              ))}
            </div>
          </article>

          <div className="map-panel">
            <iframe
              title="星辰電腦地圖"
              src="https://www.google.com/maps?q=高雄市前鎮區凱旋三路217號&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
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
                    <p className="section-kicker">Order Detail</p>
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
                    <li>CPU：{activeOrder.cpu}</li>
                    <li>主機板：{activeOrder.motherboard}</li>
                    <li>RAM：{activeOrder.ram}</li>
                    <li>硬碟：{activeOrder.storage}</li>
                    <li>顯示卡：{activeOrder.gpu}</li>
                    <li>散熱器：{activeOrder.cooler}</li>
                    <li>電源：{activeOrder.psu}</li>
                    <li>機殼：{activeOrder.pcCase}</li>
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
