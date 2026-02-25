import { recentOrders as fallbackRecentOrders, type RecentOrder } from '../data/siteData';
import { getApiBaseUrl } from './adminAuth';

export type PublicOrderStatus = 'pending' | 'shipping' | 'delivered' | 'cancelled';

export interface PublicOrder extends Omit<RecentOrder, 'requirementIntro' | 'youtubeEmbedUrl' | 'tags'> {
  id: string;
  status: PublicOrderStatus;
  salePrice?: number;
  requirementIntro: string;
  youtubeEmbedUrl?: string;
  tags: string[];
}

interface PublicOrdersResponse {
  data?: unknown;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const parseStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => asString(item)).filter(Boolean))];
};

const asStatus = (value: unknown): PublicOrderStatus => {
  if (value === 'pending' || value === 'shipping' || value === 'delivered' || value === 'cancelled') {
    return value;
  }

  return 'delivered';
};

export const normalizeYouTubeEmbedUrl = (value: string): string => {
  const raw = value.trim();
  if (!raw) {
    return '';
  }

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.replaceAll('/', '').trim();
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v')?.trim() || '';
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.replace('/embed/', '').split('/')[0]?.trim() || '';
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.replace('/shorts/', '').split('/')[0]?.trim() || '';
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }
    }
  } catch {
    return '';
  }

  return '';
};

const deriveOrderTags = (item: string, fields: string[]): string[] => {
  const searchable = [item, ...fields].join(' ').toLowerCase();
  const tags: string[] = [];

  if (/4k|2k|高幀|fps|電競|遊戲/.test(searchable)) {
    tags.push('遊戲主機');
  }

  if (/直播|實況|obs/.test(searchable)) {
    tags.push('直播用途');
  }

  if (/剪輯|創作|建模|渲染|工作站|premiere|blender|davinci|ai|生成/.test(searchable)) {
    tags.push('創作工作站');
  }

  if (/白色|主題|側透|雙艙/.test(searchable)) {
    tags.push('白色主題');
  }

  if (/企業|批量|工作室|商用/.test(searchable)) {
    tags.push('企業部署');
  }

  if (/sff|小型|itx|a4-h2o/.test(searchable)) {
    tags.push('SFF 小型');
  }

  if (/5080|5090|rtx 50/.test(searchable)) {
    tags.push('旗艦效能');
  } else if (/4070|4060/.test(searchable)) {
    tags.push('主流效能');
  }

  if (tags.length === 0) {
    tags.push('客製配單');
  }

  return [...new Set(tags)];
};

const sanitizeOrder = (value: unknown, index: number): PublicOrder | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = asString(raw.id) || `public-order-${index + 1}`;
  const date = asString(raw.date);
  const item = asString(raw.item);
  const requirementIntro = asString(raw.requirementIntro);
  const youtubeEmbedUrl = normalizeYouTubeEmbedUrl(asString(raw.youtubeEmbedUrl));
  const tags = parseStringList(raw.tags);
  const location = asString(raw.location);

  if (!date || !item || !location) {
    return null;
  }

  const salePrice = Number(raw.salePrice);
  const cpu = asString(raw.cpu) || '待補充';
  const ram = asString(raw.ram) || '待補充';
  const storage = asString(raw.storage) || '待補充';
  const gpu = asString(raw.gpu) || '待補充';
  const psu = asString(raw.psu) || '待補充';
  const pcCase = asString(raw.pcCase) || '待補充';

  return {
    id,
    date,
    item,
    requirementIntro:
      requirementIntro || `客戶需求以「${item}」為主軸，會先依用途與預算拆解再安排配置重點。`,
    youtubeEmbedUrl: youtubeEmbedUrl || undefined,
    tags: tags.length > 0 ? tags : deriveOrderTags(item, [cpu, ram, storage, gpu, psu, pcCase]),
    location,
    status: asStatus(raw.status),
    salePrice: Number.isFinite(salePrice) && salePrice >= 0 ? Math.trunc(salePrice) : undefined,
    cpu,
    ram,
    storage,
    gpu,
    psu,
    pcCase,
  };
};

export const fallbackPublicOrders: PublicOrder[] = fallbackRecentOrders.map((order, index) => ({
  id: `fallback-order-${index + 1}`,
  status: 'delivered',
  ...order,
  requirementIntro:
    order.requirementIntro ||
    `客戶需求以「${order.item}」為主軸，會先依用途與預算拆解再安排配置重點。`,
  youtubeEmbedUrl: normalizeYouTubeEmbedUrl(order.youtubeEmbedUrl || '') || undefined,
  tags:
    Array.isArray(order.tags) && order.tags.length > 0
      ? [...new Set(order.tags.map((tag) => tag.trim()).filter(Boolean))]
      : deriveOrderTags(order.item, [order.cpu, order.ram, order.storage, order.gpu, order.psu, order.pcCase]),
}));

export const getOrderDetailPath = (id: string): string => {
  return `/orders/item/${encodeURIComponent(id)}`;
};

const dedupeTags = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(value.trim());
  });

  return result;
};

export const getOrderTagOverviewPath = (tags: string | string[]): string => {
  const raw = Array.isArray(tags) ? tags : [tags];
  const normalized = dedupeTags(raw.map((item) => asString(item)).filter(Boolean));

  if (normalized.length === 0) {
    return '/orders/tags';
  }

  const params = new URLSearchParams();
  normalized.forEach((tag) => {
    params.append('tags', tag);
  });

  return `/orders/tags?${params.toString()}`;
};

export const fetchPublicOrders = async (limit = 20): Promise<PublicOrder[]> => {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit) || 20, 50));

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/public/orders?limit=${safeLimit}`);
    const payload = (await response.json()) as PublicOrdersResponse;

    if (!response.ok || !Array.isArray(payload.data)) {
      return fallbackPublicOrders;
    }

    const parsed = payload.data
      .map((item, index) => sanitizeOrder(item, index))
      .filter((item): item is PublicOrder => item !== null);

    if (parsed.length === 0) {
      return fallbackPublicOrders;
    }

    return parsed;
  } catch {
    return fallbackPublicOrders;
  }
};
