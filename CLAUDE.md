# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VoleyApp** is a fullstack volleyball learning application targeting beginner players (youth teams). It features a quiz engine, drag-and-drop field challenges, K1/K2 rotation simulators, global rankings, and a coach panel.

Monorepo layout:
```
voley-app/
├── backend/          # NestJS 10 API
├── frontend/         # Angular 19 app
├── docker-compose.yml
└── docker-compose.prod.yml
```

---

## Development Commands

### With Docker (recommended)
```bash
docker-compose up -d      # Start PostgreSQL + backend + frontend
docker-compose down       # Stop all services
```

### Local Development (without Docker)
Requires Node.js 20+ and a running PostgreSQL 14+ instance.

**Backend** (http://localhost:3000/api):
```bash
cd backend
npm install
npm run start:dev         # Watch mode
npm run build             # Compile to dist/
npm run start:prod        # Run compiled output
```

**Frontend** (http://localhost:4200):
```bash
cd frontend
npm install
ng serve                  # Dev server with API proxy
ng build                  # Production build
```

**Database setup** (first time local):
```sql
CREATE DATABASE voley_app;
CREATE USER voley_user WITH PASSWORD 'voley_pass';
GRANT ALL PRIVILEGES ON DATABASE voley_app TO voley_user;
```

Questions seeding is executed manually via:
```bash
cd backend
npm run seed
```

---

## Backend Architecture (NestJS)

Feature-based module structure under `backend/src/`:

- **auth/** — JWT + Passport strategy, login/register endpoints, guards (`JwtAuthGuard`, `RolesGuard`, `OptionalJwtGuard`), and decorators (`@Roles`, `@CurrentUser`)
- **users/** — User profiles and statistics (points, streak, games played)
- **questions/** — Question bank with 28 pre-seeded questions across 5 categories
- **game-sessions/** — Session recording, answer tracking, and point calculation (`scoring.constants.ts`)
- **rankings/** — Aggregated global leaderboard
- **training/** — Server-side validation for mini-games (field challenge, rotation simulator)
- **common/** — Global HTTP exception filter, `@CurrentUser` decorator, shared interfaces
- **config/env.config.ts** — Centralized env parsing with production validation

**Authentication flow**: JWT stored exclusively in an `httpOnly` secure cookie (`voley_access_token`). No localStorage tokens. The `auth.interceptor.ts` on the frontend handles cookie attachment; `withCredentials: true` is used for all API calls.

**User roles**: `player` (default on registration) and `coach`. Coach role must be assigned directly in the database — there is no UI for promotion.

**Key entities**:
- `User` — UUID PK, username, email, displayName, avatarEmoji, role enum, aggregated stats
- `GameSession` — links to user, stores mode, category, answers JSONB array, scores, completion flag
- `Question` — category enum, difficulty, options array, correct answer index

**TypeORM config**: `DB_SYNCHRONIZE=false` and explicit migrations (`DB_MIGRATIONS_RUN=true`) by default.

---

## Frontend Architecture (Angular 19)

Standalone components throughout, lazy-loaded feature routes.

**Path aliases** (configured in `tsconfig.json`):
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@features/*` → `src/app/features/*`
- `@env/*` → `src/environments/*`

**Dev API proxy**: All `/api/*` requests are proxied to `http://localhost:3000` via `frontend/proxy.conf.json`.

**Folder conventions** inside `src/app/`:
- `core/` — Singleton services, guards, interceptors (never import directly into feature modules)
  - `guards/auth.guard.ts` — protects authenticated routes
  - `guards/coach.guard.ts` — restricts coach-only routes
  - `interceptors/auth.interceptor.ts` — attaches credentials
  - `interceptors/error.interceptor.ts` — centralised error handling
  - `services/data-access/` — one API service per backend resource
- `shared/` — Reusable components (navbar), TypeScript interfaces/models, constants, utils
- `features/` — One folder per product feature, each with `ui/`, `data-access/`, and optionally `domain/`

**Facade pattern**: Complex features (`dashboard`, `quiz`, `ranking`, `coach`) expose a single facade service (`*.facade.ts`) that orchestrates API calls and holds component state with Observables/RxJS. Components bind to the facade, not directly to API services.

**Game modes and routes**:
| Route | Feature |
|---|---|
| `/game/quiz` | Multiple-choice quiz with streak bonuses |
| `/game/field-challenge` | Drag-and-drop players onto court |
| `/game/rotation` | K1/K2 rotation simulator |
| `/ranking` | Global leaderboard |
| `/coach` | Coach dashboard (guarded) |

---

## Scoring System

| Event | Points |
|---|---|
| Correct answer | +100 |
| Speed bonus (< 10s) | +50 |
| 3-answer streak | +50 |
| 6-answer streak | +100 |
| Wrong / timeout | 0 |

Point rules live in `backend/src/game-sessions/scoring.constants.ts`.

---

## Environment Variables

All backend config is read via `backend/src/config/env.config.ts`. Key variables:

```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=voley_app
DATABASE_USER=voley_user
DATABASE_PASSWORD=voley_pass
DB_SYNCHRONIZE=true          # false in production
JWT_SECRET=...               # min 32 chars in production
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=voley_access_token
CORS_ORIGINS=http://localhost:4200
PORT=3000
```

For production, copy `.env.production.example` → `.env.production`, replace all `CHANGE_ME` values, and use:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

---

## Security Notes

- Rate limiting: 120 req/min globally, 8 req/min on auth endpoints (Throttler module)
- Helmet middleware applied at startup
- bcryptjs with 12 rounds for password hashing
- CSRF protection via origin-checking middleware
- Docker containers run as non-root user `appuser`
- Production env validation in `env.config.ts` rejects weak secrets or unsafe CORS
