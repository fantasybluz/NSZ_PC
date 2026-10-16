export interface AdminUser {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface ErrorResponse {
  error?: {
    message?: string;
    details?: string | string[];
  };
}

// 前端和 API 在同一個網址（Cloudflare Worker），預設用相對路徑；
// 要連別的後端才設 VITE_API_BASE_URL
export const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }

  return '';
};

// 後台登入交給 Cloudflare Access：進 /admin 時 Cloudflare 先要你登入，之後瀏覽器帶著 Access 的 cookie，
// API 那邊驗 Access 加上的 JWT（backend/src/lib/access.ts）。前端不存 token，也不用帶 Authorization。

/** DPOM（星辰電腦內部管理系統）：庫存、進貨、訂單、報價單在那邊。換網域時改這裡 */
export const INTERNAL_SYSTEM_URL = 'https://dpom.bluz.dev';

/** Cloudflare Access 的登出網址 */
export const ADMIN_LOGOUT_URL = '/cdn-cgi/access/logout';

/** 登出 Cloudflare Access（整頁跳轉） */
export const logoutAdmin = (): void => {
  window.location.assign(ADMIN_LOGOUT_URL);
};

export const toApiErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const typed = payload as ErrorResponse;
  const message = typed.error?.message;
  const details = typed.error?.details;

  if (Array.isArray(details) && details.length > 0) {
    return `${message || fallback}: ${details.join(' / ')}`;
  }

  if (typeof details === 'string' && details.trim()) {
    return `${message || fallback}: ${details}`;
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
};
