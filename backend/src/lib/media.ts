// 出機照片（R2 的 MEDIA）：網址 /media/<key>，key 是 orders/<DPOM 單號>/<時間戳>-<序號>.<副檔名>（rpc.ts 的 replaceOrderImages 存的）

export const MEDIA_URL_PREFIX = '/media/';

/** worker.ts 的 /media 路由和這裡共用：只認得這個格式的 key */
export const ORDER_MEDIA_KEY = /^orders\/([A-Za-z0-9-]+)\/[A-Za-z0-9.-]+$/;

/** 照片網址 → R2 的 key；不是我們自己 R2 的照片（外部網址、格式不對）回 null */
export const orderMediaKeyOf = (url: string): string | null => {
  if (!url.startsWith(MEDIA_URL_PREFIX)) {
    return null;
  }
  let key: string;
  try {
    key = decodeURIComponent(url.slice(MEDIA_URL_PREFIX.length));
  } catch {
    return null;
  }
  return ORDER_MEDIA_KEY.test(key) ? key : null;
};

const folderOf = (key: string): string => key.slice(0, key.lastIndexOf('/') + 1);

interface WithImages {
  images?: string[];
}

/**
 * 後台刪掉一筆出機紀錄後，刪掉它在 R2 的照片。只刪屬於這筆的：
 * - 這筆 images 裡列的 /media/orders/... 照片，但別筆出機紀錄還在用的不刪
 * - 照片所在的資料夾（orders/<單號>/）沒有別筆在用的話，整個資料夾清掉（順便清掉沒列在 images 的舊檔）
 * 回傳刪了幾個檔案。
 */
export const deleteOrderMedia = async (
  bucket: R2Bucket,
  removed: WithImages,
  remaining: WithImages[],
): Promise<number> => {
  const keys = (removed.images ?? []).map(orderMediaKeyOf).filter((key): key is string => key !== null);
  if (keys.length === 0) {
    return 0;
  }

  const usedKeys = new Set(
    remaining.flatMap((order) => (order.images ?? []).map(orderMediaKeyOf)).filter((key): key is string => key !== null),
  );
  const usedFolders = new Set([...usedKeys].map(folderOf));
  const targets = new Set(keys.filter((key) => !usedKeys.has(key)));

  for (const folder of new Set(keys.map(folderOf))) {
    if (usedFolders.has(folder)) {
      continue;
    }
    let cursor: string | undefined;
    do {
      const page = await bucket.list({ prefix: folder, cursor });
      page.objects.forEach((object) => targets.add(object.key));
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  }

  const list = [...targets];
  // R2 一次最多刪 1000 個
  for (let i = 0; i < list.length; i += 1000) {
    await bucket.delete(list.slice(i, i + 1000));
  }
  return list.length;
};
