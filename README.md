# The Season

The Season is a team operations app for youth sports coaches, volunteer parent-coaches, players, and families. It gives a team one place for messages, schedules, RSVPs, file uploads, invite links, and team membership management.

This repository currently contains two related products:

- `apps/season` + `season-api`: The Season — team communication, calendar, uploads, and roster/member coordination.
- `apps/web` + `api`: CoachCore — coaching/rules/practice-planning tools.

## Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query
- API: FastAPI, SQLAlchemy async, Alembic, PostgreSQL/pgvector
- Realtime: WebSocket team channels
- Storage: MinIO/S3-compatible uploads
- Monorepo: npm workspaces + Turborepo

## Local setup

Prerequisites:

- Node.js 20+
- npm 10+
- Python 3.11+
- Docker and Docker Compose for PostgreSQL/MinIO

Copy the example environment file:

```bash
cp .env.example .env
```

Install frontend dependencies:

```bash
npm install
```

Start the full local stack:

```bash
docker compose up --build
```

Local services:

- The Season web: http://localhost:3002
- The Season API: http://localhost:8002/api/health
- CoachCore web: http://localhost:3001
- CoachCore API: http://localhost:8001/api/health
- MinIO console: http://localhost:9001

## Frontend-only development

If the APIs are already running, start only The Season frontend:

```bash
npm run dev --workspace the-season-web
```

The Season proxies `/api/*` and `/ws/*` to `SEASON_API_INTERNAL_URL`, defaulting to `http://localhost:8002`.

## Verification

Run type checks for both frontend apps:

```bash
npm run type-check
```

Run production builds for both frontend apps:

```bash
npm run build
```

Compile-check The Season API:

```bash
python3 -m compileall -q season-api
```

## Production notes

Before publishing The Season:

1. Set strong production values for `SEASON_JWT_SECRET`, database credentials, and object-storage credentials.
2. Set `CORS_ORIGINS` to the production web origin.
3. Set `SEASON_API_INTERNAL_URL` to the production internal API URL used by the Next.js server.
4. Use managed Postgres and S3-compatible object storage for production.
5. Add privacy policy and terms pages before inviting real parents or collecting youth/player information.
6. Add rate limiting, email verification, password reset, and notification delivery before public launch.

## Product direction

The Season should position around the volunteer coach's core pain:

> One calm command center for the chaos of youth sports season: messages, practice/game schedules, RSVPs, team files, and parent coordination.

The strongest publishing path is a focused MVP for one team before expanding into leagues, payments, advanced coaching intelligence, or marketplace features.
