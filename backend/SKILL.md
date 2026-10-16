# Backend Skill Guide

Purpose
This is a Cloudflare Worker (TypeScript) that exposes public APIs and admin CRUD APIs, storing data in Cloudflare D1. Admin auth is Cloudflare Access; see the root README.

Quick Start
1. From the repo root: `npm install`
2. `cp .dev.vars.example .dev.vars` (local admin login without Access, localhost only)
3. `npm run dev:api` (applies local D1 migrations, runs `wrangler dev` on 8787)

Key Commands
- `npm run typecheck` (root): type-check the Worker
- `npm run deploy` (root): check, apply D1 migrations, deploy
- `npm run state:export|state:import` (root): back up / restore all site data as JSON

Core Paths
- `src/worker.ts`: Worker entry, routing, admin auth check
- `src/lib/access.ts`: Cloudflare Access JWT verification
- `src/lib/store.ts`: D1 access (JSON snapshot, one row per collection, version-checked writes)
- `src/lib/types.ts`: domain data types
- `src/lib/validation.ts`: input validation rules
- `src/application/*`: use cases
- `src/domain/*`: domain interfaces
- `src/infrastructure/*`: persistence and security implementations

Data Model
All app state is one JSON document stored in D1 `app_state`, one row per collection (D1 rows are capped at 2MB).
See `docs/database-design.md` for the current design and the proposed normalized schema.

Environment
- `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`: Cloudflare Access team and application AUD tag (`wrangler.jsonc`)
- `ADMIN_EMAILS`: comma-separated admin emails
- `DEV_ADMIN_EMAIL`: local dev only (`.dev.vars`), honored on localhost only
- Free plan: 10ms CPU per request, so avoid heavy work such as password hashing

Conventions
- Validate all write inputs in `src/lib/validation.ts`.
- Keep handlers thin, delegate to application services.
- Prefer extending existing validators instead of ad-hoc checks.
- Keep API response shape consistent: `{ data: ... }` on success.

When Editing
- Update validators when you add or change a field.
- Keep `docs/database-design.md` in sync for structural changes.
- If you add new collections, register them in:
  - `src/domain/content/ContentRepository.ts`
  - `src/application/content/collectionValidators.ts`
  - `src/lib/types.ts`

