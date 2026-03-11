import type { IncomingMessage, ServerResponse } from 'node:http';

export const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });

  res.end(body);
};

export const parseJsonBody = async <T = Record<string, unknown>>(
  req: IncomingMessage,
): Promise<T> => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;

    if (size > 1024 * 1024) {
      throw new Error('Request body too large');
    }

    chunks.push(buffer);
  }

  if (!chunks.length) {
    return {} as T;
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {} as T;
  }

  return JSON.parse(raw) as T;
};

export const sendError = (
  res: ServerResponse,
  statusCode: number,
  message: string,
  details?: unknown,
): void => {
  sendJson(res, statusCode, {
    error: {
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
};

export const withCors = (
  req: IncomingMessage,
  res: ServerResponse,
  allowedOrigins: string[],
): boolean => {
  const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  let allowOrigin = '';

  if (allowedOrigins.includes('*')) {
    allowOrigin = requestOrigin || '*';
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  } else if (!requestOrigin && allowedOrigins.length > 0) {
    allowOrigin = allowedOrigins[0];
  }

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
};

export const notFound = (res: ServerResponse): void => {
  sendError(res, 404, 'Resource not found');
};

export const methodNotAllowed = (res: ServerResponse, methods: string[]): void => {
  res.setHeader('Allow', methods.join(', '));
  sendError(res, 405, 'Method not allowed');
};
