# Estate Commission Tracker

A full-stack system to track real-estate transaction lifecycles and auto-distribute commission between agency and agents.

## Stack
- **Backend:** NestJS · TypeScript · Mongoose · MongoDB Atlas · Jest
- **Frontend:** Nuxt 3 · Pinia · Tailwind CSS
- **Deploy:** Railway (API) · Vercel (Frontend)

## Local Setup

### Prerequisites
- Node.js 20 LTS
- MongoDB Atlas account (free M0 cluster)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set MONGODB_URI to your MongoDB Atlas connection string
npm install
npm run start:dev
```

API runs at `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
NUXT_PUBLIC_API_BASE=http://localhost:3001 npm run dev
```

App runs at `http://localhost:3000`

### Run Backend Tests

```bash
cd backend
npx jest --no-coverage --rootDir .
```

## Live URLs
- **API:** https://your-app.up.railway.app
- **Frontend:** https://your-app.vercel.app
