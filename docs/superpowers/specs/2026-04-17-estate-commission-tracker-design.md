# Design Spec: Estate Commission Tracker

**Date:** 2026-04-17  
**Stack:** NestJS + MongoDB Atlas + Nuxt 3  
**Deployment:** Vercel (frontend) + Railway (backend)

---

## 1. Architecture Overview

Monorepo with two sub-projects:

```
estate-commission-tracker/
├── backend/          # NestJS + TypeScript + Mongoose + Jest
├── frontend/         # Nuxt 3 + Pinia + Tailwind CSS
├── README.md
└── DESIGN.md
```

**Approach:** Simple layered architecture — Controllers → Services → Repositories pattern. Commission breakdown is computed when a transaction reaches `completed` and embedded in the transaction document.

---

## 2. Backend Modules

| Module | Responsibility |
|---|---|
| `agents` | Agent CRUD |
| `transactions` | Transaction lifecycle, stage transitions |
| `commission` | Commission calculation rules (50/50 policy) |

---

## 3. Data Models

### Agent
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  phone?: string,
  createdAt: Date
}
```

### Transaction
```typescript
{
  _id: ObjectId,
  propertyAddress: string,
  salePrice: number,
  totalServiceFee: number,
  stage: 'agreement' | 'earnest_money' | 'title_deed' | 'completed',
  listingAgentId: ObjectId,
  sellingAgentId: ObjectId,
  commissionBreakdown: {
    agencyAmount: number,        // 50% of totalServiceFee
    listingAgentAmount: number,  // 50% (same agent) or 25% (different)
    sellingAgentAmount: number,  // 0% (same agent) or 25% (different)
  } | null,
  stageHistory: [{ stage: string, timestamp: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. Commission Policy

- **Agency:** always 50% of `totalServiceFee`
- **Scenario 1** (listing === selling agent): that agent gets 50%, the other gets 0%
- **Scenario 2** (different agents): listing agent gets 25%, selling agent gets 25%

Breakdown is computed and embedded on transition to `completed`.

---

## 5. Stage Transition Rules

Valid order (forward only, no reversal):
```
agreement → earnest_money → title_deed → completed
```

Invalid transitions are rejected with a `400 Bad Request`.

---

## 6. API Endpoints

### Agents
| Method | Path | Description |
|---|---|---|
| GET | `/agents` | List all agents |
| POST | `/agents` | Create agent |
| GET | `/agents/:id` | Get agent detail |

### Transactions
| Method | Path | Description |
|---|---|---|
| GET | `/transactions` | List (optional `?stage=` filter) |
| POST | `/transactions` | Create transaction |
| GET | `/transactions/:id` | Detail + commission breakdown |
| PATCH | `/transactions/:id/stage` | Advance to next stage |

### Commission
| Method | Path | Description |
|---|---|---|
| GET | `/transactions/:id/commission` | Commission breakdown detail |

---

## 7. Frontend Architecture

```
frontend/
├── pages/
│   ├── index.vue                  # Dashboard — all transactions + stats
│   ├── transactions/[id].vue      # Detail + stage buttons + breakdown
│   └── agents/index.vue           # Agent list
├── components/
│   ├── TransactionCard.vue
│   ├── StageProgress.vue
│   └── CommissionBreakdown.vue
├── stores/
│   ├── transactions.ts            # Pinia store
│   └── agents.ts                  # Pinia store
└── composables/
    └── useApi.ts                  # fetch wrapper for backend
```

---

## 8. Testing Strategy

Unit tests with Jest (mandatory):

| Test file | Covers |
|---|---|
| `commission.service.spec.ts` | Scenario 1 (same agent), Scenario 2 (different agents), agency 50% rule |
| `transaction.service.spec.ts` | Valid stage transitions, invalid stage rejection |

---

## 9. Deployment

| Service | Platform | Notes |
|---|---|---|
| Backend API | Railway | NestJS, env vars via Railway dashboard |
| Frontend | Vercel | Nuxt 3, `NUXT_PUBLIC_API_BASE` points to Railway URL |
| Database | MongoDB Atlas | Free M0 cluster |
