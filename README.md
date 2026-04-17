# Estate Commission Tracker

A full-stack real-estate commission management system. Tracks transaction lifecycles (`agreement → earnest_money → title_deed → completed`) and auto-distributes service fees between agency and agents according to a configurable 50/50 policy.

## Live Demo

| Resource | URL |
|---|---|
| Frontend (Vercel) | https://technical-case-iceberg-digital.vercel.app |
| Backend API (Railway) | https://technical-case-iceberg-digital-production.up.railway.app |
| API Documentation | https://technical-case-iceberg-digital-production.up.railway.app/api/docs |

## Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS 11 · TypeScript · Mongoose · MongoDB Atlas · Swagger |
| Frontend | Nuxt 3 · Pinia · Tailwind CSS |
| Testing | Jest (20 unit tests) |
| CI | GitHub Actions (lint + test + build) |
| Deployment | Railway (API) · Vercel (Frontend) · MongoDB Atlas (DB) |

---

## Local Development

### Prerequisites

- Node.js 20 LTS
- A MongoDB Atlas account with a free M0 cluster ([create one here](https://cloud.mongodb.com))

### 1. Clone & install

```bash
git clone <repo-url>
cd estate-commission-tracker
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Open .env and fill in your MONGODB_URI
npm install
npm run start:dev
```

API runs at `http://localhost:3001`. Swagger UI at `http://localhost:3001/api/docs`.

**Seed demo data (optional but recommended):**

```bash
cd backend
npm run seed
```

Populates the database with 3 agents and 6 transactions across all stages (3 completed with commission breakdown, 3 in various active stages). Reports page will show real data immediately.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

> The frontend reads `NUXT_PUBLIC_API_BASE` from the environment (defaults to `http://localhost:3001`).

---

## Running Tests

```bash
cd backend
npx jest --rootDir . --no-coverage
```

Expected output: **20 tests, 5 suites, all passing.**

Test coverage:
- `CommissionService.calculate()` — agency 50% rule, same-agent and different-agent scenarios, sum invariant
- `getNextStage()` — all 4 valid transitions + null on completed
- `TransactionsService.advanceStage()` — advance, commission embedding at completion, 400/404 errors
- `ReportsService` — summary aggregation, stage distribution, agent leaderboard ranking, same-agent edge case

---

## API Reference

### Agents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/agents` | List all agents |
| `POST` | `/agents` | Create agent (`name`, `email`, `phone?`) |
| `GET` | `/agents/:id` | Get agent by ID |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/transactions` | List all transactions (optional `?stage=` filter) |
| `POST` | `/transactions` | Create transaction |
| `GET` | `/transactions/:id` | Get transaction detail + commission breakdown |
| `PATCH` | `/transactions/:id/stage` | Advance to next stage |
| `GET` | `/transactions/:id/commission` | Commission breakdown (populated at `completed`) |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports/summary` | Aggregate totals: agency earnings, agent earnings, pipeline value, stage distribution |
| `GET` | `/reports/agents` | Per-agent leaderboard: earnings as listing / selling, closed deals |

### Documentation

Interactive Swagger UI at `/api/docs` with request examples for every endpoint.

---

## Deployment

### MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Add a database user and whitelist `0.0.0.0/0` (or specific IPs)
3. Copy the connection string — you'll need it for Railway

### Backend → Railway

1. Push this repository to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Select the `backend/` directory as the root (or set **Root Directory** to `backend` in settings)
4. Add environment variables in Railway dashboard:
   ```
   MONGODB_URI=<your Atlas connection string>
   PORT=3001
   ```
5. Railway detects `Procfile` and runs `npm run start:prod` automatically
6. Copy the generated Railway URL (e.g. `https://your-app.up.railway.app`)

### Frontend → Vercel

1. Create a new Vercel project → **Import from GitHub**
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   NUXT_PUBLIC_API_BASE=https://your-app.up.railway.app
   ```
4. Deploy — Vercel auto-detects Nuxt 3 via `vercel.json`

---

## Commission Policy

```
Agency:           50% of totalServiceFee (always)
Same agent:       listing agent receives 50%, selling agent receives 0%
Different agents: each agent receives 25%
```

All amounts always sum to `totalServiceFee`.

---

## Architecture

See [DESIGN.md](./DESIGN.md) for detailed architectural decisions, data modeling rationale, and deployment choices.
