# Frontend Skill Guide

Purpose
This is the React + Vite frontend that includes the public site and the admin UI.

Quick Start
1. Install deps: `npm install`
2. From the repo root, run `npm run dev:api` (Worker + local D1 on 8787) and `npm run dev:web` (Vite proxies `/api` to 8787)

Key Commands
- `npm run dev`: Vite dev server
- `npm run build`: production build
- `npm run lint`: ESLint
- `npm run preview`: preview build

Core Routes
- `/`: Home
- `/categories`: Category list
- `/categories/item/:id`: Category detail
- `/builds/item/:id`: Build detail
- `/orders/tags`: Order tags overview
- `/orders/item/:id`: Order detail
- `/blog`: Blog list
- `/blog/:slug`: Blog detail
- `/admin/login`: Legacy URL, redirects to `/admin` (Cloudflare Access handles login)
- `/admin`: Admin dashboard
- `/admin/blog`: Admin blog manager

Core Paths
- `src/App.tsx`: routing and SEO defaults
- `src/pages/*`: page implementations
- `src/components/*`: shared UI components
- `src/lib/*`: API calls, auth helpers, SEO helpers
- `src/data/*`: local fallback data

Data Sources
- Public data is fetched from backend `GET /api/public/*`.
- Admin data is fetched from `GET/POST/PUT/DELETE /api/admin/*`.
- Admin auth is Cloudflare Access (cookie set by Cloudflare); the frontend stores no token. Logout is `/cdn-cgi/access/logout`.
- API calls use same-origin relative paths (`getApiBaseUrl()` returns '' unless `VITE_API_BASE_URL` is set).

Conventions
- Use `src/lib/seo.ts` for page SEO.
- Always provide fallback data for public pages to avoid blank states.
- Keep tag filtering logic consistent with backend tag catalog rules.

When Editing
- If you add a new page, register route in `src/App.tsx`.
- If you add new admin data fields, align with backend validators and types.
- Keep UI copy in sync with `siteContent` where applicable.

