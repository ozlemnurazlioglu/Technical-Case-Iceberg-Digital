# Design Decisions

## System Overview

```mermaid
flowchart LR
    User["Browser"] -->|"HTTPS"| Vercel["Vercel<br/>Nuxt 3 SSR"]
    Vercel -->|"REST / JSON"| Railway["Railway<br/>NestJS API"]
    Railway -->|"Mongoose"| Atlas["MongoDB Atlas<br/>M0 Cluster"]

    subgraph Nuxt [Nuxt 3 Frontend]
        Pages["Pages<br/>(Transactions, Reports, Agents)"]
        Stores["Pinia Stores<br/>(transactions, agents, reports)"]
        Composables["Composables<br/>(useApi, useToast)"]
        Pages --> Stores
        Stores --> Composables
    end

    subgraph Nest [NestJS Backend]
        Controllers["Controllers"]
        Services["Services"]
        Models["Mongoose Models"]
        Controllers --> Services
        Services --> Models
    end

    Vercel -.-> Nuxt
    Railway -.-> Nest
```

## Module Graph

```mermaid
flowchart TB
    App["AppModule"] --> Agents["AgentsModule"]
    App --> Transactions["TransactionsModule"]
    App --> Reports["ReportsModule"]
    Transactions --> Commission["CommissionModule<br/>(pure policy)"]
    Transactions --> Agents
    Reports --> Agents
    Reports --> Transactions

    Commission -.->|"calculate()"| Transactions
```

`CommissionModule` is a pure, dependency-free policy container. `TransactionsService` depends on `AgentsService` to validate agent existence before creation. `ReportsModule` is read-only and pulls from both collections for aggregations.

## Architecture

**Layered monolith:** Controllers → Services → Mongoose models. No CQRS, no event sourcing — the domain (4 stages, 2 entity types, 1 computed value) is simple enough that adding those patterns would obscure rather than clarify the code. A flat NestJS module graph is easy to navigate and extend if requirements grow.

**Monorepo structure:** `backend/` and `frontend/` share a single git repository. This keeps related code together, simplifies local development, and makes it trivial to verify frontend/backend type contracts by inspection rather than package versioning.

---

## Data Modeling

### Transaction as the aggregate root

All transaction-related data lives in one MongoDB document:

```
Transaction {
  propertyAddress, salePrice, totalServiceFee
  listingAgentId, sellingAgentId        ← references to Agent
  stage                                 ← current state
  stageHistory[]                        ← append-only audit log
  commissionBreakdown                   ← embedded, set once at completion
}
```

**Why embed the commission breakdown instead of computing it on read?**

Three reasons:
1. **Immutability** — once a transaction reaches `completed`, its financial record must not change even if business rules change. Embedding locks the snapshot.
2. **Read performance** — the breakdown is always displayed with the transaction; a separate collection would require a join on every detail page.
3. **Simplicity** — no cross-document consistency to manage.

### Agent as a thin entity

Agents hold only identity data (name, email, phone). Commission policy and transaction history are derived from the transaction side, not stored on the agent. This avoids denormalisation and keeps the agent document from growing as transaction volume scales.

---

## Commission Policy

```
agencyAmount      = totalServiceFee × 0.50
agentPool         = totalServiceFee × 0.50

if listingAgentId === sellingAgentId:
  listingAgentAmount = agentPool        # sole agent takes full pool
  sellingAgentAmount = 0

else:
  listingAgentAmount = agentPool × 0.5  # 25% each
  sellingAgentAmount = agentPool × 0.5
```

**Implementation choice:** The logic lives entirely in `CommissionService.calculate()` — a pure function with no database access and no side effects. This makes it:
- **Trivially unit-testable** (no mocking required; just `new CommissionService().calculate(...)`)
- **Easy to audit** (the entire policy is 10 lines)
- **Easy to extend** (e.g. a third agent type would require editing one function and its tests)

The service is called once in `TransactionsService.advanceStage()` at the moment of transition to `completed`, and its output is immediately embedded in the document.

---

## Financial Breakdown (§4.2)

The brief requires the system to report, for every completed transaction, **how much the agency earned, how much each agent earned, and why** (listing vs. selling role). It leaves the storage strategy open — embed, dedicated collection, or compute dynamically.

### Storage Options Considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Embed in the transaction document** ✅ | Atomic write with the stage transition; immutable by construction; single read serves detail page; no joins | Denormalised (agency split % frozen at completion time) | **Chosen** |
| Dedicated `commissions` collection | Easier to evolve commission-specific fields (e.g. payout status) | Extra join on every read; cross-document consistency (two-phase writes) without MongoDB transactions; more moving parts for a value that never changes after completion | Rejected |
| Compute dynamically on read | Always reflects current policy | Breaks immutability — a future policy change would retroactively alter historical records; reports must recompute on every request | Rejected |

### Why Embed Wins Here

The commission breakdown has three properties that strongly favour embedding:

1. **It is write-once, read-many.** Once a transaction hits `completed`, the breakdown is never edited. A dedicated collection's flexibility is wasted.
2. **It must be immutable.** If the agency changes its 50/50 split to 60/40 next year, last year's completed transactions must still show 50/50. Embedding freezes the snapshot; dynamic computation cannot.
3. **It is always read with its parent.** Every view that shows a commission also shows the transaction (address, price, stage). A single-document read is both simpler and faster than a lookup.

### Shape of the Embedded Breakdown

```ts
commissionBreakdown: {
  agencyAmount:        number,  // 50% of totalServiceFee
  listingAgentAmount:  number,  // share of the 50% agent pool, based on role
  sellingAgentAmount:  number,  // share of the 50% agent pool, based on role
} | null                        // null until stage === 'completed'
```

Combined with the transaction's own `listingAgentId` and `sellingAgentId`, this answers all three §4.2 questions in a single read:

| §4.2 question | Answered by |
|---|---|
| How much did the agency earn? | `commissionBreakdown.agencyAmount` |
| How much did each agent earn? | `listingAgentAmount` + `sellingAgentAmount` |
| **Why** did they earn that amount? | The **field names themselves** encode the role — the listing agent earned `listingAgentAmount`, the selling agent earned `sellingAgentAmount`. Pairing with `listingAgentId` / `sellingAgentId` gives the "who + why" without any extra lookup. |

This shape also gracefully handles the same-agent edge case: `listingAgentAmount` holds the full agent pool and `sellingAgentAmount` is `0`, making the role distinction explicit in data rather than inferred at read time.

### Consumption Points

- **Transaction detail page** (`pages/transactions/[id].vue`) renders the three amounts side by side with the two agent names, directly from the embedded object.
- **Reports layer** (`GET /reports/agents`) sums `listingAgentAmount` over transactions where the agent is the listing agent, and `sellingAgentAmount` where they are the selling agent, then merges — see the [Reporting Layer](#reporting-layer) section. Because the breakdown is embedded, this aggregation is a single collection scan with no `$lookup`.

### Trade-off Accepted

If the agency ever needs to adjust a historical commission (e.g. a corrective entry), the current design requires a migration rather than a simple policy change. This is the correct trade-off: financial records should be hard to rewrite, and explicit migrations are auditable where silent recomputation is not.

---

## Stage Transition Rules

```
agreement → earnest_money → title_deed → completed
```

### Decision on §4.1 — "Optionally prevent invalid transitions"

The brief leaves this as a design choice. **I decided to prevent invalid transitions**, because each stage represents an irreversible real-world legal event:

| Stage | Real-world event |
|---|---|
| `agreement` | Purchase agreement signed |
| `earnest_money` | Earnest money deposited |
| `title_deed` | Title deed transferred |
| `completed` | Transaction closed |

Once earnest money is deposited you cannot "un-deposit" it; once a title deed is transferred you cannot reverse it from the system's point of view. Allowing free-form transitions would require the system to model refunds, reversals, and audits that are out of scope for this case. Constraining transitions keeps the audit trail trustworthy and the reporting layer simple (a `completed` transaction's commission breakdown never changes).

### Policy

- **Forward-only:** no backward or skipping transitions
- **One step at a time:** advance one stage per request — skipping is impossible by construction
- **Terminal state:** `completed` is irreversible; attempts to advance return **400 Bad Request**

### Defense in Depth (Three Layers)

| Layer | Mechanism | What it catches |
|---|---|---|
| **API / Service** | `TransactionsService.advanceStage()` calls the pure `getNextStage()` helper; returns `400` when the transaction is already `completed` | Programmatic callers attempting to advance past the terminal state |
| **Database** | Mongoose `enum: ['agreement', 'earnest_money', 'title_deed', 'completed']` at the schema level | Direct writes with unknown/malformed stage values |
| **Frontend** | "Advance to …" button is hidden when `stage === 'completed'` and replaced with a "Transaction completed" badge (`pages/transactions/[id].vue`) | User cannot even attempt an invalid click |

The frontend check is strictly a UX improvement — the backend remains authoritative and rejects any request that somehow bypasses the UI.

### Implementation

`getNextStage()` in `stage-transitions.ts` is a pure lookup function tested in isolation. The service calls it without knowing the ordering logic; if the order ever changes, only `stage-transitions.ts` changes. The `STAGE_ORDER` constant is the single source of truth reused by the schema, the service, the frontend, and the tests.

### Trade-off Accepted

Hard-preventing transitions means there is no built-in "undo" or admin override. If the business later needs to cancel a transaction mid-flow, the intended extension is a new `cancelled` terminal stage (or a separate cancellation event) rather than allowing arbitrary backward movement — keeping the audit log strictly append-only.

---

## Validation Strategy

**Backend (authoritative):**
- `class-validator` decorators on DTOs (`@IsString`, `@IsEmail`, `@IsMongoId`, `@IsPositive`)
- `ValidationPipe({ whitelist: true, transform: true })` strips unknown fields and coerces types globally
- Business-rule validation (invalid stage transition) throws `BadRequestException` in the service

**Frontend (UX layer):**
- HTML5 `required` / `type="email"` / `type="number"` on form inputs for immediate feedback
- Agent selects are populated from the live agent list, making it impossible to submit an invalid agent ID

The backend never trusts the frontend; validation is duplicated intentionally.

---

## Error Handling

| Scenario | HTTP status | Where |
|---|---|---|
| Resource not found (agent, transaction) | 404 | Service layer (`NotFoundException`) |
| Invalid stage advance / already completed | 400 | Service layer (`BadRequestException`) |
| Validation failure (bad body) | 400 | `ValidationPipe` (global) |
| Duplicate email on agent creation | 409 | Service layer (`ConflictException`) — Mongoose duplicate-key (`E11000`) caught and rethrown |

---

## Frontend State Management

Pinia stores (`transactions`, `agents`) own all server state. Pages call store actions; components receive props only — no component fetches data directly. This keeps components purely presentational and makes the data flow linear and easy to trace.

The `useApi` composable centralises `baseURL` from `runtimeConfig.public.apiBase`. Changing the API endpoint (e.g. switching from local to deployed Railway URL) requires changing one environment variable.

---

## Reporting Layer

Three design choices:

1. **Separate `ReportsModule`** — aggregations don't belong in `TransactionsService` (which owns lifecycle) or `AgentsService` (which owns identity). A dedicated read-only module keeps the separation clean.
2. **In-memory aggregation from `.lean()` queries** — the dataset size (one agency's transactions) doesn't justify MongoDB aggregation pipelines; plain TypeScript reductions are easier to read, easier to test, and fast enough.
3. **Same-agent transactions count once** — in agent leaderboard, a transaction where the same agent is both listing and selling increments `completedTransactions` once (not twice) for that agent. This matches commission policy (they receive the full agent pool, not split) and intuitive "how many deals closed" semantics.

Two endpoints:
- `GET /reports/summary` — totals + pipeline + stage distribution
- `GET /reports/agents` — per-agent earnings, sorted by total

## API Documentation

**Swagger / OpenAPI** at `/api/docs` via `@nestjs/swagger`. DTOs carry `@ApiProperty` decorators with realistic examples. This turns the API into a self-documenting, interactive surface that evaluators can test directly in the browser without Postman.

## Testing Strategy

| File | Approach | Tests |
|---|---|---|
| `commission.service.spec.ts` | Pure unit (no mocks) | Agency 50% rule, Scenario 1 (same agent), Scenario 2 (different agents), sum invariant on both paths |
| `stage-transitions.spec.ts` | Pure unit (no mocks) | All 3 valid transitions, null on completed, enum length guard |
| `transactions.service.spec.ts` | Unit with mocks | Stage advance + history append, commission embedding at completion, 400 on advancing completed, 404 on missing transaction |
| `reports.service.spec.ts` | Unit with mocks | Summary aggregation, stage distribution, empty-database edge case, agent leaderboard ranking, same-agent edge case |
| `agents.service.spec.ts` | Unit with mocks | Successful create, **409 Conflict on duplicate email (E11000)**, rethrow on unrelated errors, 404 on missing agent |
| `app.controller.spec.ts` | Unit | Root endpoint returns API metadata (name, version, docs path, endpoint links) |

**24 tests across 6 suites, all passing** (`npx jest --rootDir . --no-coverage`). The commission service, stage-transition utility, and reports aggregation are pure/near-pure functions — no database, minimal DI. This makes them the fastest and most reliable tests in the suite and maps directly to §4.3 (commission policy) and §4.1 (stage lifecycle) of the brief.

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`) runs on every push and PR:
- Backend: `npm ci` → ESLint (zero warnings) → Jest → `nest build`
- Frontend: `npm ci` → `nuxt prepare` → `nuxt build`

Catches regressions before they reach `main`. Cache is keyed on `package-lock.json` for fast runs.

---

## Deployment

| Layer | Platform | Notes |
|---|---|---|
| Database | MongoDB Atlas M0 | Free tier, connection via `MONGODB_URI` env var |
| Backend API | Railway | `Procfile` runs `npm run start:prod`; env vars set in Railway dashboard |
| Frontend | Vercel | Auto-detects Nuxt 3 via `vercel.json`; `NUXT_PUBLIC_API_BASE` points to Railway URL |

**Why Railway for the backend?** Railway natively supports Node.js processes via `Procfile`, provides environment variable management, and offers a free tier sufficient for this project. Zero Dockerfile required.

**Why Vercel for the frontend?** First-class Nuxt 3 support with automatic SSR/static detection. The `vercel.json` specifies the framework and output directory; everything else is automatic.
