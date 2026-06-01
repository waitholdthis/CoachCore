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

## Demo data

The Season includes an idempotent Falcons U10 demo seed for local or staging screenshots, walkthroughs, and sales/showcase demos.

Preview the seed plan without database access:

```bash
cd season-api
python3 scripts/seed_demo.py --dry-run
```

After the database has been migrated and `SEASON_DATABASE_URL` points at the target environment, seed the demo:

```bash
cd season-api
SEASON_DEMO_PASSWORD="change-this-local-demo-password" python3 scripts/seed_demo.py
```

Enable the one-click demo route only in local/staging:

```bash
SEASON_DEMO_ENABLED=true
SEASON_DEMO_EMAIL=demo-coach@theseason.local
ENVIRONMENT=staging
```

Then open `/demo/access` from the web app. The route requests a guarded demo token, selects the seeded Falcons U10 team, and redirects into the authenticated app. It stays disabled when `ENVIRONMENT=production` or `SEASON_DEMO_ENABLED` is false.

The seed creates:

- Demo coach account: `demo-coach@theseason.local`
- Team: `Falcons U10`
- Invite code: `FALCONU10`
- Parent/member records, including one pending member
- Team chat and announcement channels
- Game-week messages
- Practice/game/reminder events
- RSVPs and file records for screenshot-ready product states

Use a non-production password and do not enable demo credentials in a real public production environment.

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
5. Review the draft privacy policy and terms with qualified counsel before inviting real parents or collecting youth/player information.
6. Add rate limiting, email verification, password reset, and notification delivery before public launch.

## Product direction

The Season should position around the volunteer coach's core pain:

> One calm command center for the chaos of youth sports season: messages, practice/game schedules, RSVPs, team files, and parent coordination.

The strongest publishing path is a focused MVP for one team before expanding into leagues, payments, advanced coaching intelligence, or marketplace features.
