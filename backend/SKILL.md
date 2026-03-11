# Backend Skill Guide

Purpose
This service is a Node.js + TypeScript backend that exposes public APIs, admin CRUD APIs, and auth, using PostgreSQL as the datastore.

Quick Start
1. Start PostgreSQL (Docker is recommended).
2. Install deps: `npm install`
3. Create env: `cp .env.example .env`
4. Initialize DB: `npm run db:init`
5. Run server: `npm run dev`

Key Commands
- `npm run dev`: run with watch mode
- `npm run start`: run without watch
- `npm run db:init`: initialize schema and seed data
- `npm run reset-admin -- <newPassword> [username]`: reset admin password

Core Paths
- `src/server.ts`: HTTP server, routing, OpenAPI
- `src/lib/store.ts`: PostgreSQL access, JSONB snapshot store
- `src/lib/types.ts`: domain data types
- `src/lib/validation.ts`: input validation rules
- `src/application/*`: use cases
- `src/domain/*`: domain interfaces
- `src/infrastructure/*`: persistence and security implementations

Data Model
The current implementation stores the whole app state in a single JSONB row (`app_state`).
See `docs/database-design.md` for the current design and the proposed normalized schema.

Environment
- `DATABASE_URL`: Postgres connection string
- `PORT`: server port (default 3000)
- `CORS_ORIGIN`: frontend origin
- `AUTH_SECRET`, `TOKEN_TTL_HOURS`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`

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

