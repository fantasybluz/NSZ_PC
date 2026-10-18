import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import OrderPhoto from '../components/OrderPhoto';
import {
  fetchPublicOrder,
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

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; order: PublicOrder }
  | { kind: 'not_found' }
  | { kind: 'error' };

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

  // 直接用 id 查一筆（/api/public/orders/:id），不管有幾筆出機紀錄都打得開
  const [state, setState] = React.useState<LoadState>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!decodedId) {
      return undefined;
    }
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchPublicOrder(decodedId)
      .then((order) => {
        if (!cancelled) setState(order ? { kind: 'ok', order } : { kind: 'not_found' });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [decodedId, reloadKey]);

  if (!decodedId) {
    return <Navigate to="/" replace />;
  }

  if (state.kind !== 'ok') {
    return (
      <div className="page order-detail-page">
        <section className="section-card reveal">
          {state.kind === 'loading' ? <p className="admin-note">讀取出機紀錄中...</p> : null}
          {state.kind === 'not_found' ? (
            <>
              <h1 className="section-title">找不到這筆出機紀錄</h1>
              <p className="section-sub">這筆紀錄可能已經下架了，可以看看其他出機紀錄。</p>
            </>
          ) : null}
          {state.kind === 'error' ? (
            <>
              <h1 className="section-title">出機紀錄暫時載入不了</h1>
              <p className="section-sub">請稍後再試一次。</p>
            </>
          ) : null}
          {state.kind !== 'loading' ? (
            <div className="hero-actions">
              {state.kind === 'error' ? (
                <button type="button" className="solid-btn" onClick={() => setReloadKey((key) => key + 1)}>
                  重新載入
                </button>
              ) : null}
              <Link to="/orders/tags" className={state.kind === 'error' ? 'ghost-btn' : 'solid-btn'}>
                看全部出機紀錄
              </Link>
              <Link to="/" className="ghost-btn">
                回首頁
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  const { order } = state;
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
          <div className="detail-card-item order-detail-facts">
            <i className="fa-solid fa-truck-fast" aria-hidden="true" />
            <div>
              <p>出貨日期：{order.date}</p>
              <p>交機地區：{order.location}</p>
              <p>狀態：{orderStatusLabelMap[order.status]}</p>
              {typeof order.salePrice === 'number' && order.salePrice > 0 ? <p>成交金額：NT$ {order.salePrice.toLocaleString('zh-TW')}</p> : null}
            </div>
          </div>
          <div className="hero-actions">
            <Link to="/" className="solid-btn">
              回首頁
            </Link>
            <Link to="/orders/tags" className="ghost-btn">
              看更多出機紀錄
            </Link>
          </div>
        </div>

        <div className="category-detail-media order-detail-media">
          <OrderPhoto src={order.images[0]} alt={order.item} loading="eager" />
        </div>
      </section>

      {order.images.length > 1 ? (
        <section className="section-card reveal">
          <div className="section-head">
            <h2 className="section-title">更多照片</h2>
          </div>
          <div className="order-photo-grid">
            {order.images.slice(1).map((src, index) => (
              <OrderPhoto key={src} src={src} alt={`${order.item} 照片 ${index + 2}`} />
            ))}
          </div>
        </section>
      ) : null}

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
