// 給 DPOM（星辰電腦內部管理系統）呼叫的內部介面：把完成的訂單發布成官網的「出機紀錄」。
//
// 這是 Workers RPC（WorkerEntrypoint），只有綁定了這個 Worker 的 Worker（DPOM 的 wrangler.jsonc 的 services）
// 叫得到，沒有任何公開網址，所以不用另外驗身分；DPOM 那邊已經過 Cloudflare Access 登入。
// 寫入照樣走 validateOrderInput（跟後台手動新增一樣的檢查）。

import { WorkerEntrypoint } from 'cloudflare:workers';

import { createServiceContainer } from './interfaces/http/serviceContainer.ts';
import { useDatabase } from './lib/store.ts';
import type { MutablePayload } from './lib/types.ts';

/** 出機照片：存在 R2（MEDIA），網址是 /media/<key>（worker.ts 提供） */
export const MEDIA_PREFIX = '/media/';

export interface PublishImage {
  name: string;
  type: string;
  data: ArrayBuffer;
}

export interface PublishOrderInput {
  date: string; // YYYY/MM/DD
  item: string;
  requirementIntro: string;
  youtubeEmbedUrl: string;
  tags: string[];
  location: string;
  salePrice: number;
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  cpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  cooler: string;
  pcCase: string;
}

export type PublishResult =
  | { ok: true; id: string; path: string }
  | { ok: false; errors: string[] };

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

const services = createServiceContainer();

// ref 是來源單號（例如 dpom-14），只能是英數字、減號
const safeRef = (ref: string): string => {
  if (!/^[A-Za-z0-9-]{1,64}$/.test(ref)) {
    throw new Error('invalid ref');
  }
  return ref;
};

export class WebsiteAPI extends WorkerEntrypoint<Env> {
  /** 換掉某張單的出機照片（先刪掉舊的），回傳官網用的網址 */
  async replaceOrderImages(ref: string, images: PublishImage[]): Promise<string[]> {
    const prefix = `orders/${safeRef(ref)}/`;
    if (images.length > MAX_IMAGES) {
      throw new Error(`一次最多 ${MAX_IMAGES} 張`);
    }
    for (const image of images) {
      if (!EXT_BY_TYPE[image.type]) {
        throw new Error(`不支援的圖片格式：${image.type}`);
      }
      if (image.data.byteLength > MAX_IMAGE_BYTES) {
        throw new Error('每張圖片最大 10MB');
      }
    }

    const old = await this.env.MEDIA.list({ prefix });
    if (old.objects.length) {
      await this.env.MEDIA.delete(old.objects.map((o) => o.key));
    }

    const stamp = Date.now();
    const urls: string[] = [];
    for (const [i, image] of images.entries()) {
      const key = `${prefix}${stamp}-${i + 1}.${EXT_BY_TYPE[image.type]}`;
      await this.env.MEDIA.put(key, image.data, { httpMetadata: { contentType: image.type } });
      urls.push(`${MEDIA_PREFIX}${key}`);
    }
    return urls;
  }

  /** 新增或更新一筆出機紀錄（orderId 有給、而且還在就更新） */
  async publishOrder(orderId: string | null, input: PublishOrderInput, images: string[]): Promise<PublishResult> {
    useDatabase(this.env.DB);
    // 服務費不公開（官網只顯示售價），存 0
    const payload = { ...input, images, serviceFee: 0 } as unknown as MutablePayload;

    if (orderId) {
      const existing = await services.crudService.get('orders', orderId);
      if (existing.kind === 'ok') {
        const updated = await services.crudService.update('orders', orderId, payload);
        if (updated.kind === 'validation_failed') return { ok: false, errors: updated.errors };
        if (updated.kind === 'ok') return { ok: true, id: orderId, path: `/orders/item/${orderId}` };
      }
    }

    const created = await services.crudService.create('orders', payload);
    if (created.kind === 'validation_failed') return { ok: false, errors: created.errors };
    if (created.kind !== 'ok') return { ok: false, errors: ['發布失敗'] };
    return { ok: true, id: created.data.id, path: `/orders/item/${created.data.id}` };
  }

  /** 官網出機紀錄用過的標籤（發布時給選），用得多的排前面 */
  async orderTags(): Promise<string[]> {
    useDatabase(this.env.DB);
    const orders = await services.crudService.list('orders');
    const count = new Map<string, number>();
    for (const order of orders as { tags?: string[] }[]) {
      for (const tag of order.tags ?? []) count.set(tag, (count.get(tag) ?? 0) + 1);
    }
    return [...count].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }

  /** 從官網拿掉（出機紀錄和照片都刪） */
  async unpublishOrder(orderId: string, ref: string): Promise<void> {
    useDatabase(this.env.DB);
    await services.crudService.remove('orders', orderId);
    const old = await this.env.MEDIA.list({ prefix: `orders/${safeRef(ref)}/` });
    if (old.objects.length) {
      await this.env.MEDIA.delete(old.objects.map((o) => o.key));
    }
  }
}
