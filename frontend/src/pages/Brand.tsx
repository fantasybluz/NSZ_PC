import React from 'react';
import { Link } from 'react-router-dom';

import {
  fallbackPublicOrders,
  fetchPublicOrders,
  getOrderDetailPath,
  getOrderTagOverviewPath,
} from '../lib/publicOrders';
import { defaultPublicSiteContent, fetchPublicSiteContent } from '../lib/publicSiteContent';

const Brand: React.FC = () => {
  const [recentOrders, setRecentOrders] = React.useState(fallbackPublicOrders);
  const [siteContent, setSiteContent] = React.useState(defaultPublicSiteContent);
  const [shipmentSlideIndex, setShipmentSlideIndex] = React.useState(0);
  const [shipmentSlidesPerView, setShipmentSlidesPerView] = React.useState(3);

  React.useEffect(() => {
    const loadOrders = async () => {
      const next = await fetchPublicOrders(20);
      if (next.length > 0) {
        setRecentOrders(next);
      }
    };

    loadOrders().catch(() => {
      // Keep fallback static orders when backend is unavailable.
    });
  }, []);

  React.useEffect(() => {
    const loadSiteContent = async () => {
      const next = await fetchPublicSiteContent();
      setSiteContent(next);
    };

    loadSiteContent().catch(() => {
      // Keep fallback site content when backend is unavailable.
    });
  }, []);

  React.useEffect(() => {
    const syncSlidesPerView = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        setShipmentSlidesPerView(1);
        return;
      }

      if (width <= 960) {
        setShipmentSlidesPerView(2);
        return;
      }

      setShipmentSlidesPerView(3);
    };

    syncSlidesPerView();
    window.addEventListener('resize', syncSlidesPerView);
    return () => window.removeEventListener('resize', syncSlidesPerView);
  }, []);

  const shipmentTotalPages = Math.max(1, Math.ceil(recentOrders.length / shipmentSlidesPerView));
  const safeShipmentSlideIndex = Math.min(shipmentSlideIndex, shipmentTotalPages - 1);
  const shipmentSlides = Array.from({ length: shipmentTotalPages }, (_, pageIndex) =>
    recentOrders.slice(pageIndex * shipmentSlidesPerView, (pageIndex + 1) * shipmentSlidesPerView),
  );

  React.useEffect(() => {
    setShipmentSlideIndex((prev) => Math.min(prev, shipmentTotalPages - 1));
  }, [shipmentTotalPages]);

  React.useEffect(() => {
    if (shipmentTotalPages <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setShipmentSlideIndex((prev) => (prev + 1) % shipmentTotalPages);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [shipmentTotalPages]);

  const goShipmentPrev = () => {
    setShipmentSlideIndex((prev) => (prev - 1 + shipmentTotalPages) % shipmentTotalPages);
  };

  const goShipmentNext = () => {
    setShipmentSlideIndex((prev) => (prev + 1) % shipmentTotalPages);
  };

  return (
    <div className="page brand-page">
      <section className="page-hero reveal">
        <p className="section-kicker">Shipping Process</p>
        <h1>{siteContent.brandHeroTitle}</h1>
        <p>{siteContent.brandHeroSubtitle}</p>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Step by Step</p>
          <h2 className="section-title">流程細節</h2>
        </div>

        <div className="timeline-list">
          {siteContent.shippingSteps.map((step, idx) => (
            <article key={step.title} className="timeline-item">
              <span>{String(idx + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Recent Shipment</p>
          <h2 className="section-title">近期出貨</h2>
        </div>

        <div className="shipment-slider">
          <div className="shipment-slider-window">
            <div
              className="shipment-slider-track"
              style={{ transform: `translateX(-${safeShipmentSlideIndex * 100}%)` }}
            >
              {shipmentSlides.map((slideOrders, pageIndex) => (
                <div key={pageIndex} className="shipment-slide" aria-hidden={safeShipmentSlideIndex !== pageIndex}>
                  <div
                    className="shipment-slide-grid"
                    style={{ gridTemplateColumns: `repeat(${shipmentSlidesPerView}, minmax(0, 1fr))` }}
                  >
                    {slideOrders.map((order) => (
                      <article key={order.id} className="shipment-item">
                        <strong>{order.date}</strong>
                        <p>{order.item}</p>
                        {order.tags.length > 0 ? (
                          <div className="tag-cloud shipment-tags">
                            {order.tags.map((tag) => (
                              <Link
                                key={`${order.id}-${tag}`}
                                to={getOrderTagOverviewPath(tag)}
                                className="tag-pill"
                              >
                                #{tag}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                        <span>{order.location}</span>
                        <ul className="shipment-core-specs">
                          <li>CPU：{order.cpu}</li>
                          <li>RAM：{order.ram}</li>
                          <li>硬碟：{order.storage}</li>
                          <li>顯示卡：{order.gpu}</li>
                          <li>電源：{order.psu}</li>
                          <li>機殼：{order.pcCase}</li>
                        </ul>
                        <Link to={getOrderDetailPath(order.id)} className="text-link">
                          查看完整紀錄
                          <i className="fa-solid fa-arrow-right" />
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {shipmentTotalPages > 1 ? (
            <div className="shipment-slider-controls">
              <div className="shipment-slider-nav">
                <button type="button" className="shipment-slider-btn" onClick={goShipmentPrev} aria-label="上一組出貨">
                  <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                </button>
                <button type="button" className="shipment-slider-btn" onClick={goShipmentNext} aria-label="下一組出貨">
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              </div>

              <span className="shipment-slider-status">
                第 {safeShipmentSlideIndex + 1} / {shipmentTotalPages} 頁（共 {recentOrders.length} 筆）
              </span>

              <div className="shipment-slider-dots" aria-label="近期出貨分頁">
                {shipmentSlides.map((_, pageIndex) => (
                  <button
                    key={pageIndex}
                    type="button"
                    className={`shipment-slider-dot ${pageIndex === safeShipmentSlideIndex ? 'active' : ''}`}
                    onClick={() => setShipmentSlideIndex(pageIndex)}
                    aria-label={`切換到第 ${pageIndex + 1} 頁`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Promise</p>
          <h2 className="section-title">你會拿到的服務</h2>
        </div>

        <div className="service-grid">
          {siteContent.serviceHighlights.map((item) => (
            <article key={item} className="service-item">
              <i className="fa-solid fa-shield-heart" aria-hidden="true" />
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Brand;
