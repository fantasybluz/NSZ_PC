import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import {
  fallbackPublicOrders,
  fetchPublicOrders,
  getOrderTagOverviewPath,
  normalizeYouTubeEmbedUrl,
  type PublicOrder,
} from '../lib/publicOrders';

const orderStatusLabelMap = {
  pending: '待處理',
  shipping: '配送中',
  delivered: '已送達',
  cancelled: '已取消',
} as const;

const OrderDetail: React.FC = () => {
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

  const [orders, setOrders] = React.useState<PublicOrder[]>(fallbackPublicOrders);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadOrders = async () => {
      const next = await fetchPublicOrders(50);
      setOrders(next);
      setIsLoading(false);
    };

    loadOrders().catch(() => {
      setIsLoading(false);
    });
  }, []);

  if (!decodedId) {
    return <Navigate to="/" replace />;
  }

  const order = orders.find((item) => item.id === decodedId);

  if (!order && !isLoading) {
    return <Navigate to="/" replace />;
  }

  if (!order) {
    return (
      <div className="page order-detail-page">
        <section className="section-card reveal">
          <p className="admin-note">讀取出機紀錄中...</p>
        </section>
      </div>
    );
  }

  const embedUrl = normalizeYouTubeEmbedUrl(order.youtubeEmbedUrl || '');

  return (
    <div className="page order-detail-page">
      <section className="page-hero reveal category-detail-hero">
        <div>
          <h1>{order.item}</h1>
          <p>{order.requirementIntro}</p>
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
          <div className="hero-actions">
            <Link to="/" className="solid-btn">
              回首頁
            </Link>
            <Link to="/orders/tags" className="ghost-btn">
              看更多出機紀錄
            </Link>
          </div>
        </div>

        <div className="detail-card-item">
          <i className="fa-solid fa-truck-fast" aria-hidden="true" />
          <div>
            <p>出貨日期：{order.date}</p>
            <p>交機地區：{order.location}</p>
            <p>狀態：{orderStatusLabelMap[order.status]}</p>
            {typeof order.salePrice === 'number' && order.salePrice > 0 ? <p>成交金額：NT$ {order.salePrice.toLocaleString('zh-TW')}</p> : null}
          </div>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <h2 className="section-title">客戶需求描述</h2>
        </div>
        <p>{order.requirementIntro}</p>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <h2 className="section-title">配備說明</h2>
        </div>

        <div className="detail-card-grid build-core-list">
          {order.cpu ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-microchip" aria-hidden="true" />
              <p>CPU：{order.cpu}</p>
            </article>
          ) : null}
          {order.motherboard ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-network-wired" aria-hidden="true" />
              <p>主機板：{order.motherboard}</p>
            </article>
          ) : null}
          {order.ram ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-memory" aria-hidden="true" />
              <p>RAM：{order.ram}</p>
            </article>
          ) : null}
          {order.storage ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-hard-drive" aria-hidden="true" />
              <p>硬碟：{order.storage}</p>
            </article>
          ) : null}
          {order.gpu ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-tv" aria-hidden="true" />
              <p>顯示卡：{order.gpu}</p>
            </article>
          ) : null}
          {order.cooler ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-fan" aria-hidden="true" />
              <p>散熱器：{order.cooler}</p>
            </article>
          ) : null}
          {order.psu ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-bolt" aria-hidden="true" />
              <p>電源供應器：{order.psu}</p>
            </article>
          ) : null}
          {order.pcCase ? (
            <article className="detail-card-item">
              <i className="fa-solid fa-box-open" aria-hidden="true" />
              <p>機殼：{order.pcCase}</p>
            </article>
          ) : null}
        </div>
      </section>

      {embedUrl ? (
        <section className="section-card reveal">
          <div className="section-head">
            <h2 className="section-title">影片</h2>
          </div>
          <div className="build-video-frame">
            <iframe
              src={embedUrl}
              title={`${order.item} YouTube 影片`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default OrderDetail;
