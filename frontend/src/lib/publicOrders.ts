import { getApiBaseUrl } from './adminAuth';

export type PublicOrderStatus = 'pending' | 'shipping' | 'delivered' | 'cancelled';

// 公開 API 的出機紀錄（沒有服務費，後端回傳前就拿掉了）
export interface PublicOrder {
  id: string;
  date: string;
  item: string;
  location: string;
  status: PublicOrderStatus;
  salePrice?: number;
  requirementIntro: string;
  youtubeEmbedUrl?: string;
  tags: string[];
  images: string[];
  cpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  cooler: string;
  pcCase: string;
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
  const images = parseStringList(raw.images);

  if (!date || !item || !location) {
    return null;
  }

  const salePrice = Number(raw.salePrice);
  const cpu = asString(raw.cpu) || '';
  const motherboard = asString(raw.motherboard) || '';
  const ram = asString(raw.ram) || '';
  const storage = asString(raw.storage) || '';
  const gpu = asString(raw.gpu) || '';
  const psu = asString(raw.psu) || '';
  const cooler = asString(raw.cooler) || '';
  const pcCase = asString(raw.pcCase) || '';

  return {
    id,
    date,
    item,
    requirementIntro:
      requirementIntro || `客戶需求以「${item}」為主軸，會先依用途與預算拆解再安排配置重點。`,
    youtubeEmbedUrl: youtubeEmbedUrl || undefined,
    tags: tags.length > 0 ? tags : deriveOrderTags(item, [cpu, motherboard, ram, storage, gpu, psu, cooler, pcCase]),
    images,
    location,
    status: asStatus(raw.status),
    salePrice: Number.isFinite(salePrice) && salePrice >= 0 ? Math.trunc(salePrice) : undefined,
    cpu,
    motherboard,
    ram,
    storage,
    gpu,
    psu,
    cooler,
    pcCase,
  };
};

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

/** 讀不到（網路、伺服器錯誤）時丟這個；頁面要顯示「暫時載入不了」，不能拿範例資料充數 */
export class PublicOrdersError extends Error {}

/**
 * 出機紀錄列表。limit 是幾筆（1～100），'all' 是全部（出機標籤頁要全部拿來篩選）。
 * API 讀不到就丟 PublicOrdersError；沒有紀錄回空陣列。
 */
export const fetchPublicOrders = async (limit: number | 'all' = 20): Promise<PublicOrder[]> => {
  const query = limit === 'all' ? 'all' : String(Math.max(1, Math.min(Math.trunc(limit) || 20, 100)));

  let response: Response;
  let payload: PublicOrdersResponse;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/public/orders?limit=${query}`);
    payload = (await response.json()) as PublicOrdersResponse;
  } catch {
    throw new PublicOrdersError('出機紀錄讀不到');
  }

  if (!response.ok || !Array.isArray(payload.data)) {
    throw new PublicOrdersError('出機紀錄讀不到');
  }

  return payload.data
    .map((item, index) => sanitizeOrder(item, index))
    .filter((item): item is PublicOrder => item !== null);
};

/** 一筆出機紀錄（出機詳細頁）。沒有這筆回 null；API 讀不到丟 PublicOrdersError */
export const fetchPublicOrder = async (id: string): Promise<PublicOrder | null> => {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/public/orders/${encodeURIComponent(id)}`);
  } catch {
    throw new PublicOrdersError('出機紀錄讀不到');
  }

  if (response.status === 404) {
    return null;
  }

  let payload: PublicOrdersResponse;
  try {
    payload = (await response.json()) as PublicOrdersResponse;
  } catch {
    throw new PublicOrdersError('出機紀錄讀不到');
  }
  if (!response.ok) {
    throw new PublicOrdersError('出機紀錄讀不到');
  }
  return sanitizeOrder(payload.data, 0);
};
