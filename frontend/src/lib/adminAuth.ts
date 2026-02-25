export const ADMIN_TOKEN_KEY = 'nszpc_admin_token';
export const ADMIN_USER_KEY = 'nszpc_admin_user';

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  data: {
    token: string;
    expiresInHours: number;
    user: AdminUser;
  };
}

interface ErrorResponse {
  error?: {
    message?: string;
    details?: string | string[];
  };
}

export const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }

  return 'http://localhost:3000';
};

export const getStoredToken = (): string => {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
};

export const getStoredUser = (): AdminUser | null => {
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
};

export const storeAuth = (token: string, user: AdminUser): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
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
