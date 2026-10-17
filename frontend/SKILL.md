# Frontend Skill Guide

React + Vite frontend for the NSZPC website: public pages and the admin UI at `/admin`. The docs live in `docs/` and are written in Traditional Chinese; this file only points there.

- Start here: [CLAUDE.md](../CLAUDE.md) (commands, conventions, which docs to update)
- Pages, admin tabs, layout (Apple style, `Shelf`, `AdminShell`): [docs/architecture.md](../docs/architecture.md#前端)
- What each page should do and the public-page rules: [docs/requirements.md](../docs/requirements.md)
- Design spec: [DESIGN.md](../DESIGN.md)

Quick reminders:

- Run `npm run dev:api` and `npm run dev:web` from the repo root (Vite proxies `/api` and `/media` to 8787)
- New routes go in `src/App.tsx`; admin pages are wrapped in `components/AdminShell.tsx`
- Public pages must not show admin-facing text, service fees or the app version; hide empty fields instead of showing placeholders
- Check new pages at 393px and 1440px wide
- Page SEO goes through `src/lib/seo.ts` and must match the titles in `backend/src/lib/sharePreview.ts`
