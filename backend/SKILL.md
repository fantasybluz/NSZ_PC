# Backend Skill Guide

Cloudflare Worker API for the NSZPC website (`src/worker.ts`). The docs live in `docs/` and are written in Traditional Chinese; this file only points there.

- Start here: [CLAUDE.md](../CLAUDE.md) (commands, which docs to update for each kind of change, conventions)
- Architecture, D1 tables, JSON state model, Access login, security: [docs/architecture.md](../docs/architecture.md)
- Every route and the DPOM RPC (`WebsiteAPI`): [docs/api.md](../docs/api.md) — must match `src/routes.ts`, checked by `npm run check`
- Local dev, deploy, Cloudflare resources: [docs/setup.md](../docs/setup.md)
- Design decisions: [docs/decisions/](../docs/decisions/)

Quick reminders:

- Run commands from the repo root: `npm run dev:api`, `npm run typecheck`, `npm run check`
- Adding a field: `src/lib/types.ts` + `src/lib/validation.ts` + the `normalize*` function in `src/lib/store.ts` (or it is dropped on read)
- Adding a route: `src/worker.ts` + `src/routes.ts` + `docs/api.md`
- Writes go through `mutateDb` in `src/lib/store.ts`; keep per-request CPU low (free plan: 10ms)
