import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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

const normalizeTag = (value: string): string => value.trim().toLowerCase();

const dedupeTags = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    const normalized = normalizeTag(trimmed);

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(trimmed);
  });

  return result;
};

const parseSelectedTags = (search: string): string[] => {
  const params = new URLSearchParams(search);
  const raw = params
    .getAll('tags')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return dedupeTags(raw);
};

const isTagSelected = (tag: string, selectedTags: string[]): boolean => {
  const normalizedTag = normalizeTag(tag);
  return selectedTags.some((selected) => normalizeTag(selected) === normalizedTag);
};

const OrderTagOverview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = React.useState<PublicOrder[]>(fallbackPublicOrders);
  const [siteContent, setSiteContent] = React.useState(defaultPublicSiteContent);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadSiteContent = async () => {
      const next = await fetchPublicSiteContent();
      setSiteContent(next);
    };

    loadSiteContent().catch(() => {
      // Keep fallback site content when request fails.
    });
  }, []);

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

  const selectedTags = React.useMemo(() => parseSelectedTags(location.search), [location.search]);

  const allTags = React.useMemo(() => {
    const tags = [
      ...siteContent.shipmentTagCatalog,
      ...orders
      .flatMap((order) => order.tags)
      .map((tag) => tag.trim())
      .filter(Boolean),
    ];

    return dedupeTags(tags);
  }, [orders, siteContent.shipmentTagCatalog]);

  const availableTags = React.useMemo(() => {
    return dedupeTags([...allTags, ...selectedTags]);
  }, [allTags, selectedTags]);

  const visibleOrders = React.useMemo(() => {
    if (selectedTags.length === 0) {
      return orders;
    }

    return orders.filter((order) => {
      const orderTagSet = new Set(order.tags.map((tag) => normalizeTag(tag)));
      return selectedTags.every((tag) => orderTagSet.has(normalizeTag(tag)));
    });
  }, [orders, selectedTags]);

  const updateSelectedTags = (nextTags: string[]) => {
    navigate(getOrderTagOverviewPath(nextTags), { replace: true });
  };

  const handleToggleTag = (tag: string) => {
    if (isTagSelected(tag, selectedTags)) {
      updateSelectedTags(
        selectedTags.filter((item) => normalizeTag(item) !== normalizeTag(tag)),
      );
      return;
    }

    updateSelectedTags([...selectedTags, tag]);
  };

  const summaryText =
    selectedTags.length > 0
      ? `目前篩選：${selectedTags.map((tag) => `#${tag}`).join('、')}`
      : '尚未套用標籤篩選，顯示全部出機紀錄。';

  return (
    <div className="page order-tag-overview-page">
      <section className="page-hero reveal">
        <p className="section-kicker">Shipment Tag Filter</p>
        <h1>標籤主機總覽</h1>
        <p>點任一標籤可篩選有相同需求的出機紀錄；可連續加選多個標籤縮小結果。</p>

        <div className="hero-actions">
          <Link to="/categories" className="ghost-btn">
            回分類總覽
          </Link>
          <Link to="/" className="solid-btn">
            回首頁
          </Link>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Tag Toolbar</p>
          <h2 className="section-title">標籤篩選器</h2>
          <p className="section-sub">{summaryText}</p>
        </div>

        <div className="order-tag-toolbar">
          <button
            type="button"
            className={`tag-pill tag-pill-button ${selectedTags.length === 0 ? 'active' : ''}`}
            onClick={() => updateSelectedTags([])}
          >
            全部
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-pill tag-pill-button ${isTagSelected(tag, selectedTags) ? 'active' : ''}`}
              onClick={() => handleToggleTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>

        {selectedTags.length > 0 ? (
          <div className="order-tag-toolbar-meta">
            <span>已選 {selectedTags.length} 個標籤</span>
            <button type="button" className="ghost-btn" onClick={() => updateSelectedTags([])}>
              清除篩選
            </button>
          </div>
        ) : null}
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Matched Builds</p>
          <h2 className="section-title">符合標籤的主機 ({visibleOrders.length})</h2>
        </div>

        {visibleOrders.length > 0 ? (
          <div className="shipment-list order-tag-result-list">
            {visibleOrders.map((order) => (
              <article key={order.id} className="shipment-item">
                <strong>{order.date}</strong>
                <p>需求：{order.item}</p>
                {order.tags.length > 0 ? (
                  <div className="tag-cloud shipment-tags">
                    {order.tags.map((tag) => (
                      <button
                        key={`${order.id}-${tag}`}
                        type="button"
                        className={`tag-pill tag-pill-button ${isTagSelected(tag, selectedTags) ? 'active' : ''}`}
                        onClick={() => handleToggleTag(tag)}
                      >
                        #{tag}
                      </button>
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
        ) : (
          <p className="admin-note">目前沒有同時符合這組標籤的出機紀錄，請移除部分標籤再試一次。</p>
        )}
      </section>

      {isLoading ? (
        <section className="section-card reveal">
          <p className="admin-note">正在同步最新出機紀錄...</p>
        </section>
      ) : null}
    </div>
  );
};

export default OrderTagOverview;
