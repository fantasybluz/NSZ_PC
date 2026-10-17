// Cloudflare Worker 入口：/api、/openapi.json、/api-docs 走這裡，其他網址是 frontend/dist 的靜態檔案（wrangler.jsonc 的 assets）。
// 路由跟原本 Node 版（server.ts）一樣，只是登入改成 Cloudflare Access：
//   - /api/public/*：不用登入
//   - /api/auth/me、/api/admin/*：要有 Access 的 JWT，而且 email 在 ADMIN_EMAILS（lib/access.ts）
// 原本的 /api/auth/login、/api/auth/password 拿掉了（網站不再存密碼）。

import versionFile from '../../VERSION';
import type { ManagedCollection } from './domain/content/ContentRepository.ts';
import { adminUser, authenticateAdmin, type AccessConfig } from './lib/access.ts';
import {
  API_SECURITY_HEADERS,
  BodyError,
  errorResponse,
  json,
  methodNotAllowed,
  notFound,
  readJsonObject,
  withHeaders,
} from './lib/http.ts';
import { getOpenApiDocument } from './lib/openapi.ts';
import { SHARE_PREVIEW_PATHS, withSharePreview } from './lib/sharePreview.ts';
import { robotsTxt, sitemapXml } from './lib/sitemap.ts';
import { useDatabase } from './lib/store.ts';
import type { MutablePayload, PublicUser } from './lib/types.ts';
import { createServiceContainer } from './interfaces/http/serviceContainer.ts';

// DPOM 發布出機紀錄用的內部介面（只有綁定的 Worker 叫得到）
export { WebsiteAPI } from './rpc.ts';

// wrangler types 有讀到 .dev.vars 時會把 DEV_ADMIN_EMAIL 寫成必填，這裡統一當成選填
type WorkerEnv = Omit<Env, 'DEV_ADMIN_EMAIL'> & {
  /** 只在本機開發用（.dev.vars）：localhost 上不經過 Access，直接當這個 email 登入 */
  DEV_ADMIN_EMAIL?: string;
};

// 版號只寫在 repo 根目錄的 VERSION（前端 vite.config.ts 也讀它，見 RELEASING.md）
const APP_VERSION = versionFile.trim();

const services = createServiceContainer();

/** 會改資料的請求（POST/PUT/PATCH/DELETE），而且來源不是自己網站 */
const isCrossSiteWrite = (request: Request, url: URL): boolean => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false;
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return true;
  const origin = request.headers.get('Origin');
  if (!origin || origin === url.origin) return false;
  // 本機開發：前端開發伺服器（另一個 port）把 /api 代理過來，Origin 是 localhost:5173 之類的，不算跨站
  return !(isLocalhost(url.hostname) && isLocalhost(new URL(origin).hostname));
};

const isLocalhost = (host: string): boolean => host === 'localhost' || host === '127.0.0.1';

const now = (): string => new Date().toISOString();

const parseEmails = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const isLocal = (url: URL): boolean => url.hostname === 'localhost' || url.hostname === '127.0.0.1';

const buildSwaggerHtml = (specUrl: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NSZPC API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fff; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="/api-docs/init.js"></script>
  </body>
</html>`;

// Swagger UI 的初始化放在另一支檔案，CSP 才不用開 'unsafe-inline'
const SWAGGER_INIT = `window.ui = SwaggerUIBundle({
  url: '/openapi.json',
  dom_id: '#swagger-ui',
  deepLinking: true,
  docExpansion: 'list',
  defaultModelsExpandDepth: 1,
});`;

const SWAGGER_CSP =
  "default-src 'none'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; " +
  "img-src 'self' data: https://unpkg.com; connect-src 'self'; frame-ancestors 'none'";

const resolveCollectionName = (value?: string): ManagedCollection | null => {
  if (!value) {
    return null;
  }
  if (value === 'blog-posts') {
    return 'blogPosts';
  }
  const direct = value as ManagedCollection;
  if (
    direct === 'builds' ||
    direct === 'categories' ||
    direct === 'orders'
  ) {
    return direct;
  }
  return null;
};

const handleCrudCollection = async (
  request: Request,
  collectionName: string | undefined,
  id: string | undefined,
): Promise<Response> => {
  const collection = resolveCollectionName(collectionName);
  if (!collection) {
    return notFound();
  }

  if (!id) {
    if (request.method === 'GET') {
      return json(200, { data: await services.crudService.list(collection) });
    }
    if (request.method === 'POST') {
      const payload = (await readJsonObject(request)) as MutablePayload;
      const result = await services.crudService.create(collection, payload);
      if (result.kind === 'validation_failed') {
        return errorResponse(422, 'Validation failed', result.errors);
      }
      if (result.kind === 'not_found') {
        return notFound();
      }
      return json(201, { data: result.data });
    }
    return methodNotAllowed(['GET', 'POST']);
  }

  if (request.method === 'GET') {
    const result = await services.crudService.get(collection, id);
    return result.kind === 'not_found' ? notFound() : json(200, { data: result.data });
  }
  if (request.method === 'PUT') {
    const payload = (await readJsonObject(request)) as MutablePayload;
    const result = await services.crudService.update(collection, id, payload);
    if (result.kind === 'validation_failed') {
      return errorResponse(422, 'Validation failed', result.errors);
    }
    if (result.kind === 'not_found') {
      return notFound();
    }
    return json(200, { data: result.data });
  }
  if (request.method === 'DELETE') {
    const result = await services.crudService.remove(collection, id);
    return result.kind === 'not_found' ? notFound() : json(200, { data: result.data });
  }
  return methodNotAllowed(['GET', 'PUT', 'DELETE']);
};

/** 後台的登入檢查；通過回傳登入的人，不通過回傳錯誤 Response */
const requireAdmin = async (request: Request, env: WorkerEnv, url: URL): Promise<PublicUser | Response> => {
  if (env.DEV_ADMIN_EMAIL && isLocal(url)) {
    return adminUser(env.DEV_ADMIN_EMAIL.toLowerCase());
  }

  const config: AccessConfig = {
    teamDomain: env.ACCESS_TEAM_DOMAIN,
    audience: env.ACCESS_AUD,
    adminEmails: parseEmails(env.ADMIN_EMAILS),
  };
  const result = await authenticateAdmin(request, config);
  if (result.ok) {
    return result.user;
  }
  if (result.status === 503) {
    return errorResponse(503, '後台登入還沒設定好（Cloudflare Access）');
  }
  if (result.status === 403) {
    return errorResponse(403, 'Forbidden', '這個帳號沒有後台權限');
  }
  return errorResponse(401, 'Unauthorized', '請重新整理頁面，重新登入');
};

const route = async (request: Request, env: WorkerEnv, url: URL): Promise<Response> => {
  const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const method = request.method;

  if (parts[0] === 'openapi.json') {
    return method === 'GET' ? json(200, getOpenApiDocument(url.origin)) : methodNotAllowed(['GET']);
  }

  if (parts[0] === 'api-docs' || parts[0] === 'docs') {
    if (method !== 'GET') {
      return methodNotAllowed(['GET']);
    }
    if (parts[1] === 'init.js') {
      return new Response(SWAGGER_INIT, {
        headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    return new Response(buildSwaggerHtml('/openapi.json'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': SWAGGER_CSP },
    });
  }

  // 出機照片（DPOM 發布時存進 R2）：公開讀取，檔名有時間戳記，可以長期快取
  if (parts[0] === 'media') {
    if (method !== 'GET' && method !== 'HEAD') {
      return methodNotAllowed(['GET']);
    }
    const key = decodeURIComponent(url.pathname.slice('/media/'.length));
    if (!/^orders\/[A-Za-z0-9-]+\/[A-Za-z0-9.-]+$/.test(key)) {
      return notFound();
    }
    const object = await env.MEDIA.get(key);
    if (!object) {
      return notFound();
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
    return new Response(method === 'HEAD' ? null : object.body, { headers });
  }

  if (parts[0] !== 'api') {
    return notFound();
  }

  if (parts[1] === 'health' && method === 'GET') {
    return json(200, { status: 'ok', version: APP_VERSION, timestamp: now() });
  }

  if (parts[1] === 'public') {
    if (method !== 'GET') {
      return methodNotAllowed(['GET']);
    }
    switch (parts[2]) {
      case 'builds':
        return json(200, { data: await services.publicQueryService.listBuilds() });
      case 'categories':
        return json(200, { data: await services.publicQueryService.listCategories() });
      case 'orders': {
        const limit = Number(url.searchParams.get('limit') || 5);
        return json(200, { data: await services.publicQueryService.listOrders(limit) });
      }
      case 'blog-posts':
        return json(200, { data: await services.publicQueryService.listBlogPosts() });
      case 'site-content':
        return json(200, { data: await services.publicQueryService.getSiteContent() });
      default:
        return notFound();
    }
  }

  if (parts[1] === 'auth') {
    if (parts[2] !== 'me') {
      return notFound();
    }
    if (method !== 'GET') {
      return methodNotAllowed(['GET']);
    }
    const user = await requireAdmin(request, env, url);
    return user instanceof Response ? user : json(200, { data: user });
  }

  if (parts[1] === 'admin') {
    const user = await requireAdmin(request, env, url);
    if (user instanceof Response) {
      return user;
    }

    if (parts[2] === 'site-content') {
      if (method === 'GET') {
        return json(200, { data: await services.siteContentService.getSiteContent() });
      }
      if (method === 'PUT') {
        const payload = (await readJsonObject(request)) as MutablePayload;
        const result = await services.siteContentService.updateSiteContent(payload);
        if (result.kind === 'validation_failed') {
          return errorResponse(422, 'Validation failed', result.errors);
        }
        return json(200, { data: result.data });
      }
      return methodNotAllowed(['GET', 'PUT']);
    }

    return handleCrudCollection(request, parts[2], parts[3]);
  }

  return notFound();
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    useDatabase(env.DB);

    if (url.pathname === '/robots.txt') {
      return robotsTxt(url.origin);
    }
    if (url.pathname === '/sitemap.xml') {
      try {
        return await sitemapXml(url.origin, services.crudService);
      } catch (error) {
        console.error('sitemap', error);
        return errorResponse(500, 'Internal server error');
      }
    }

    // 出機紀錄、推薦配單、分類、文章頁：照樣回前端頁面，只是先換掉分享縮圖和 SEO 的標籤（lib/sharePreview.ts）
    if (/^\/(orders|builds|categories)\/|^\/blog(\/|$)/.test(url.pathname)) {
      const page = await env.ASSETS.fetch(request);
      return SHARE_PREVIEW_PATHS.test(url.pathname) ? withSharePreview(page, url, services.crudService) : page;
    }

    let response: Response;
    try {
      // 擋跨站請求（CSRF）：會改資料的請求只接受從自己網站送出的（DPOM 是用 RPC，不經過這裡）
      response = isCrossSiteWrite(request, url)
        ? errorResponse(403, 'Forbidden', '不接受從其他網站送出的請求')
        : await route(request, env, url);
    } catch (error) {
      if (error instanceof BodyError) {
        response = errorResponse(400, error.message);
      } else {
        console.error(error);
        response = errorResponse(500, 'Internal server error');
      }
    }
    return withHeaders(response, API_SECURITY_HEADERS);
  },
} satisfies ExportedHandler<WorkerEnv>;
