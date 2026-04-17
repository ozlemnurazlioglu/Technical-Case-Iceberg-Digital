# Design Decisions

## Architecture

Simple layered architecture: Controllers → Services → Mongoose models. No CQRS or event-sourcing — the domain is small enough that a direct service call is clearer and easier to test.

## Financial Breakdown Storage

The commission breakdown is **embedded in the transaction document** and computed once when the stage transitions to `completed`.

Rationale: The breakdown is immutable after completion and always read together with the transaction. A separate collection would add a join with no benefit. Dynamic computation would lose the historical snapshot if business rules change.

## Stage Transitions

Stages follow a strict forward-only order: `agreement → earnest_money → title_deed → completed`. Reverse transitions are rejected with `400 Bad Request` because each stage represents an irreversible real-world event (signed contract, earnest money paid, title deed signed).

## Commission Policy

- Agency always receives 50% of `totalServiceFee`.
- If `listingAgentId === sellingAgentId`: that agent receives the full 50% agent pool.
- Otherwise: each agent receives 25%.

Logic lives in `CommissionService.calculate()` — a pure function with no database access — making it trivial to unit-test.

## Frontend State Management

Pinia stores (`transactions`, `agents`) own all server state. Pages call store actions; components receive props. The `useApi` composable centralises the `baseURL` so changing the API endpoint requires editing one file.

## Testing Strategy

Unit tests cover:
- `CommissionService.calculate()` — 5 tests for all commission scenarios
- `getNextStage()` — 5 tests for all stage transition paths
- `TransactionsService.advanceStage()` — 4 tests including error cases
