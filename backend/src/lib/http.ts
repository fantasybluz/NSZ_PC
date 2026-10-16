// Worker 的 Response 小工具（錯誤格式跟原本 Node 版一樣：{ error: { message, details? } }）

// API 回應都加上的安全標頭；API 不會被當網頁顯示，CSP 給最嚴的
export const API_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

const MAX_BODY_BYTES = 1024 * 1024;

export const json = (status: number, payload: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });

export const errorResponse = (status: number, message: string, details?: unknown): Response =>
  json(status, {
    error: {
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });

export const notFound = (): Response => errorResponse(404, 'Resource not found');

export const methodNotAllowed = (methods: string[]): Response => {
  const response = errorResponse(405, 'Method not allowed');
  response.headers.set('Allow', methods.join(', '));
  return response;
};

export class BodyError extends Error {}

/** 讀 JSON body；只收物件，超過 1MB 或格式不對丟 BodyError */
export const readJsonObject = async (request: Request): Promise<Record<string, unknown>> => {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY_BYTES) {
    throw new BodyError('Request body too large');
  }

  const raw = (await request.text()).trim();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new BodyError('Request body too large');
  }
  if (!raw) {
    return {};
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new BodyError('Invalid JSON payload');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BodyError('Invalid JSON payload');
  }
  return payload as Record<string, unknown>;
};

export const withHeaders = (response: Response, headers: Record<string, string>): Response => {
  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    if (!next.headers.has(key)) {
      next.headers.set(key, value);
    }
  }
  return next;
};
