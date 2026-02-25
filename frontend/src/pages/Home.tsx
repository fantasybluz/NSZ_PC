import React from 'react';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import {
  fallbackPublicBuilds,
  fetchPublicBuilds,
  getBuildDetailPath,
  type PublicBuild,
} from '../lib/publicBuilds';
import {
  fallbackPublicOrders,
  fetchPublicOrders,
  getOrderDetailPath,
  getOrderTagOverviewPath,
  type PublicOrder,
} from '../lib/publicOrders';
import {
  defaultPublicSiteContent,
  fetchPublicSiteContent,
} from '../lib/publicSiteContent';

const Home: React.FC = () => {
  const [builds, setBuilds] = React.useState<PublicBuild[]>(fallbackPublicBuilds);
  const [recentOrders, setRecentOrders] = React.useState<PublicOrder[]>(fallbackPublicOrders);
  const [siteContent, setSiteContent] = React.useState(defaultPublicSiteContent);

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
              查看近期出機
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
          <h2 className="section-title">{siteContent.brandHeroTitle || '近期出機'}</h2>
          <p className="section-sub">{siteContent.brandHeroSubtitle || '依近期實際出機案例整理，包含需求重點與配備說明。'}</p>
        </div>

        <div className="shipment-list">
          {recentOrders.slice(0, 6).map((order) => (
            <article key={order.id} className="shipment-item">
              <strong>{order.date}</strong>
              <p>需求：{order.item}</p>
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
              <span>交機地區：{order.location}</span>
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
    </div>
  );
};

export default Home;
