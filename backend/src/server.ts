import http, { type IncomingMessage, type ServerResponse } from 'node:http';

import type { ManagedCollection } from './domain/content/ContentRepository.ts';
import { loadEnvFile } from './lib/env.ts';
import {
  methodNotAllowed,
  notFound,
  parseJsonBody,
  sendError,
  sendJson,
  withCors,
} from './lib/http.ts';
import { getOpenApiDocument } from './lib/openapi.ts';
import { initStore } from './lib/store.ts';
import type { MutablePayload, PublicUser } from './lib/types.ts';
import {
  validateLoginInput,
  validatePasswordChangeInput,
} from './lib/validation.ts';
import { createServiceContainer } from './interfaces/http/serviceContainer.ts';

await loadEnvFile('.env', { overrideExisting: true });

interface ServerConfig {
  port: number;
  corsOrigin: string;
  authSecret: string;
  tokenTtlHours: number;
  adminUsername: string;
  adminPassword: string;
}

const config: ServerConfig = {
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  authSecret: process.env.AUTH_SECRET || 'development-secret-change-me',
  tokenTtlHours: Number(process.env.TOKEN_TTL_HOURS || 8),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123456',
};

await initStore({
  adminUsername: config.adminUsername,
  adminPassword: config.adminPassword,
});

const services = createServiceContainer({
  authSecret: config.authSecret,
  tokenTtlHours: config.tokenTtlHours,
});

const now = (): string => new Date().toISOString();

const getRequestOrigin = (req: IncomingMessage): string => {
  const host = req.headers.host || `localhost:${config.port}`;
  const forwarded = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwarded) ? forwarded[0] : forwarded || 'http';
  return `${protocol}://${host}`;
};

const sendHtml = (res: ServerResponse, statusCode: number, html: string): void => {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
  });
  res.end(html);
};

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
    <script>
      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
      });
    </script>
  </body>
</html>`;

const normalizePath = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

const getParts = (pathname: string): string[] => normalizePath(pathname).split('/').filter(Boolean);

const parseBody = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<MutablePayload | null> => {
  try {
    const payload = await parseJsonBody<unknown>(req);

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      sendError(res, 400, 'Invalid JSON payload');
      return null;
    }

    return payload as MutablePayload;
  } catch (error) {
    const message = error instanceof SyntaxError ? 'Invalid JSON payload' : 'Unable to parse payload';
    sendError(res, 400, message);
    return null;
  }
};

const authGuard = async (req: IncomingMessage, res: ServerResponse): Promise<PublicUser | null> => {
  const result = await services.authService.authenticateHeader(req.headers.authorization);

  if (result.kind === 'ok') {
    return result.user;
  }

  if (result.kind === 'missing_token') {
    sendError(res, 401, 'Unauthorized');
    return null;
  }

  if (result.kind === 'invalid_token') {
    sendError(res, 401, 'Unauthorized', result.reason);
    return null;
  }

  sendError(res, 401, 'Unauthorized', 'user not found');
  return null;
};

const resolveCollectionName = (value?: string): ManagedCollection | null => {
  if (!value) {
    return null;
  }

  if (value === 'personal-procurements') {
    return 'personalProcurements';
  }

  if (value === 'blog-posts') {
    return 'blogPosts';
  }

  const direct = value as ManagedCollection;
  if (
    direct === 'builds' ||
    direct === 'categories' ||
    direct === 'orders' ||
    direct === 'inventories' ||
    direct === 'procurements'
  ) {
    return direct;
  }

  return null;
};

interface CrudContext {
  collectionName?: string;
  id?: string;
  method: string;
  req: IncomingMessage;
  res: ServerResponse;
}

const handleCrudCollection = async ({
  collectionName,
  id,
  method,
  req,
  res,
}: CrudContext): Promise<void> => {
  const managedCollection = resolveCollectionName(collectionName);
  if (!managedCollection) {
    notFound(res);
    return;
  }

  if (!id) {
    if (method === 'GET') {
      const list = await services.crudService.list(managedCollection);
      sendJson(res, 200, { data: list });
      return;
    }

    if (method === 'POST') {
      const payload = await parseBody(req, res);
      if (!payload) {
        return;
      }

      const result = await services.crudService.create(managedCollection, payload);
      if (result.kind === 'validation_failed') {
        sendError(res, 422, 'Validation failed', result.errors);
        return;
      }

      sendJson(res, 201, { data: result.data });
      return;
    }

    methodNotAllowed(res, ['GET', 'POST']);
    return;
  }

  if (method === 'GET') {
    const result = await services.crudService.get(managedCollection, id);
    if (result.kind === 'not_found') {
      notFound(res);
      return;
    }

    sendJson(res, 200, { data: result.data });
    return;
  }

  if (method === 'PUT') {
    const payload = await parseBody(req, res);
    if (!payload) {
      return;
    }

    const result = await services.crudService.update(managedCollection, id, payload);
    if (result.kind === 'validation_failed') {
      sendError(res, 422, 'Validation failed', result.errors);
      return;
    }

    if (result.kind === 'not_found') {
      notFound(res);
      return;
    }

    sendJson(res, 200, { data: result.data });
    return;
  }

  if (method === 'DELETE') {
    const result = await services.crudService.remove(managedCollection, id);
    if (result.kind === 'not_found') {
      notFound(res);
      return;
    }

    sendJson(res, 200, { data: result.data });
    return;
  }

  methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
};

const server = http.createServer(async (req, res) => {
  const allowedOrigin = config.corsOrigin === '*' ? '*' : config.corsOrigin;
  if (withCors(req, res, allowedOrigin)) {
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const parts = getParts(url.pathname);
    const origin = getRequestOrigin(req);
    const method = req.method || 'GET';

    if (parts.length === 0) {
      sendJson(res, 200, {
        name: 'NSZPC Admin Backend API',
        status: 'ok',
        docs: `${origin}/api-docs`,
        openapi: `${origin}/openapi.json`,
      });
      return;
    }

    if (parts[0] === 'openapi.json') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }

      sendJson(res, 200, getOpenApiDocument(origin));
      return;
    }

    if (parts[0] === 'api-docs' || parts[0] === 'docs') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }

      sendHtml(res, 200, buildSwaggerHtml('/openapi.json'));
      return;
    }

    if (parts[0] !== 'api') {
      notFound(res);
      return;
    }

    if (parts[1] === 'health' && method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        timestamp: now(),
      });
      return;
    }

    if (parts[1] === 'auth') {
      if (parts[2] === 'login') {
        if (method !== 'POST') {
          methodNotAllowed(res, ['POST']);
          return;
        }

        const payload = await parseBody(req, res);
        if (!payload) {
          return;
        }

        const validation = validateLoginInput(payload);
        if (!validation.ok) {
          sendError(res, 422, 'Validation failed', validation.errors);
          return;
        }

        const loginResult = await services.authService.login(validation.value);
        if (loginResult.kind === 'invalid_credentials') {
          sendError(res, 401, 'Invalid username or password');
          return;
        }

        sendJson(res, 200, {
          data: loginResult.data,
        });
        return;
      }

      if (parts[2] === 'me') {
        if (method !== 'GET') {
          methodNotAllowed(res, ['GET']);
          return;
        }

        const user = await authGuard(req, res);
        if (!user) {
          return;
        }

        sendJson(res, 200, { data: user });
        return;
      }

      if (parts[2] === 'password') {
        if (method !== 'PUT') {
          methodNotAllowed(res, ['PUT']);
          return;
        }

        const user = await authGuard(req, res);
        if (!user) {
          return;
        }

        const payload = await parseBody(req, res);
        if (!payload) {
          return;
        }

        const validation = validatePasswordChangeInput(payload);
        if (!validation.ok) {
          sendError(res, 422, 'Validation failed', validation.errors);
          return;
        }

        const changeResult = await services.authService.changePassword(user.id, validation.value);
        if (changeResult.kind === 'user_not_found') {
          sendError(res, 401, 'Unauthorized', 'user not found');
          return;
        }

        if (changeResult.kind === 'invalid_current_password') {
          sendError(res, 401, 'Current password is invalid');
          return;
        }

        sendJson(res, 200, { data: { success: true } });
        return;
      }

      notFound(res);
      return;
    }

    if (parts[1] === 'public') {
      if (parts[2] === 'builds' && method === 'GET') {
        const data = await services.publicQueryService.listBuilds();
        sendJson(res, 200, { data });
        return;
      }

      if (parts[2] === 'categories' && method === 'GET') {
        const data = await services.publicQueryService.listCategories();
        sendJson(res, 200, { data });
        return;
      }

      if (parts[2] === 'orders' && method === 'GET') {
        const rawLimit = Number(url.searchParams.get('limit') || 5);
        const data = await services.publicQueryService.listOrders(rawLimit);
        sendJson(res, 200, { data });
        return;
      }

      if (parts[2] === 'blog-posts' && method === 'GET') {
        const data = await services.publicQueryService.listBlogPosts();
        sendJson(res, 200, { data });
        return;
      }

      if (parts[2] === 'site-content' && method === 'GET') {
        const data = await services.publicQueryService.getSiteContent();
        sendJson(res, 200, { data });
        return;
      }

      notFound(res);
      return;
    }

    if (parts[1] === 'admin') {
      const user = await authGuard(req, res);
      if (!user) {
        return;
      }

      if (parts[2] === 'dashboard') {
        if (method !== 'GET') {
          methodNotAllowed(res, ['GET']);
          return;
        }

        const data = await services.dashboardService.getOverview();
        sendJson(res, 200, { data });
        return;
      }

      if (parts[2] === 'site-content') {
        if (method === 'GET') {
          const data = await services.siteContentService.getSiteContent();
          sendJson(res, 200, { data });
          return;
        }

        if (method === 'PUT') {
          const payload = await parseBody(req, res);
          if (!payload) {
            return;
          }

          const updateResult = await services.siteContentService.updateSiteContent(payload);
          if (updateResult.kind === 'validation_failed') {
            sendError(res, 422, 'Validation failed', updateResult.errors);
            return;
          }

          sendJson(res, 200, {
            data: updateResult.data,
          });
          return;
        }

        methodNotAllowed(res, ['GET', 'PUT']);
        return;
      }

      await handleCrudCollection({
        collectionName: parts[2],
        id: parts[3],
        method,
        req,
        res,
      });
      return;
    }

    notFound(res);
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'Internal server error');
  }
});

server.listen(config.port, () => {
  console.log(`NSZPC backend running on http://localhost:${config.port}`);
});
