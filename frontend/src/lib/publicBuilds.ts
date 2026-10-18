import { getApiBaseUrl } from './adminAuth';

export interface PublicBuild {
  id: string;
  name: string;
  description: string;
  detailIntro: string;
  requirementIntro: string;
  youtubeEmbedUrl?: string;
  price: number;
  dealDate?: string;
  image: string;
  badge?: string;
  tags: string[];
  cpu?: string;
  motherboard?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  psu?: string;
  pcCase?: string;
  accessories: string[];
  specs: string[];
}

interface PublicBuildsResponse {
  data?: unknown;
}

const sanitizeString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const sanitizeSpecs = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

const isDealDateFormat = (value: string): boolean => {
  return /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(value);
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

const sanitizeBuild = (value: unknown): PublicBuild | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = sanitizeString(raw.id);
  const name = sanitizeString(raw.name);
  const description = sanitizeString(raw.description);
  const detailIntro = sanitizeString(raw.detailIntro);
  const requirementIntro = sanitizeString(raw.requirementIntro);
  const youtubeEmbedUrl = normalizeYouTubeEmbedUrl(sanitizeString(raw.youtubeEmbedUrl));
  const image = sanitizeString(raw.image);
  const specs = sanitizeSpecs(raw.specs);
  const price = Number(raw.price);
  const dealDateRaw = sanitizeString(raw.dealDate);
  const badgeRaw = sanitizeString(raw.badge);
  const tags = sanitizeSpecs(raw.tags);
  const cpu = sanitizeString(raw.cpu);
  const motherboard = sanitizeString(raw.motherboard);
  const ram = sanitizeString(raw.ram);
  const storage = sanitizeString(raw.storage);
  const gpu = sanitizeString(raw.gpu);
  const psu = sanitizeString(raw.psu);
  const pcCase = sanitizeString(raw.pcCase);
  const accessories = sanitizeSpecs(raw.accessories);

  if (!id || !name || !description || !image || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    id,
    name,
    description,
    detailIntro: detailIntro || description,
    requirementIntro: requirementIntro || '此配單會先依用途與預算拆解需求，再安排升級路線。',
    youtubeEmbedUrl: youtubeEmbedUrl || undefined,
    price,
    dealDate: isDealDateFormat(dealDateRaw) ? dealDateRaw : undefined,
    image,
    badge: badgeRaw || undefined,
    tags,
    cpu: cpu || undefined,
    motherboard: motherboard || undefined,
    ram: ram || undefined,
    storage: storage || undefined,
    gpu: gpu || undefined,
    psu: psu || undefined,
    pcCase: pcCase || undefined,
    accessories,
    specs,
  };
};

export const getBuildDetailPath = (id: string): string => {
  return `/builds/item/${encodeURIComponent(id)}`;
};

/**
 * 推薦配單列表。API 讀不到就丟錯誤（頁面顯示「暫時載入不了」或整段不顯示），
 * 不拿範例配單充數（客人會以為真的有這些配單和價格）；沒有配單回空陣列。
 */
export const fetchPublicBuilds = async (): Promise<PublicBuild[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/public/builds`);
  const payload = (await response.json()) as PublicBuildsResponse;

  if (!response.ok || !Array.isArray(payload.data)) {
    throw new Error('推薦配單讀不到');
  }

  return payload.data
    .map((item) => sanitizeBuild(item))
    .filter((item): item is PublicBuild => item !== null);
};
