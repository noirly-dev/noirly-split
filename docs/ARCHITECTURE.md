# Noirly Split — Architecture

**Status:** Approved baseline  
**Product:** Group expense splitting for friend groups, roommates, and trip parties  
**Host app:** `noirly-split` (Next.js App Router)  
**Platform:** Aligns with Flow / Ledger / Pulse / Identity

### Locked decisions

| Concern | Choice | Rationale |
|---|---|---|
| Auth | Auth.js v5 → Noirly Identity OIDC (`noirly-split` confidential client) | Same SSO as every Noirly product; Google/email live on Identity only |
| Data | MongoDB + Mongoose + App Router REST | Matches Flow/Ledger/Pulse; dual cookie + Bearer ready for future mobile |
| Realtime | `@noirly-dev/realtime-client` + host-minted JWTs | Self-hosted; `kind:id` channels; server `internal/publish` |
| Design | Editorial canvas/ink (Flow/Identity tokens) | Platform consistency; JetBrains Mono for monetary amounts |
| FX | Rate locked at expense entry (manual override) | Settlements don't drift with live rates |
| Debt simplify | Greedy settle on net balances | Correct Splitwise-style minimal payments; simple, explainable |

---

## 1. Executive summary & goals

Noirly Split is a production web app for informal cost-sharing. The atomic unit is a **group** of people (not an org workspace): a trip, roommates, or a recurring friend circle. Any member can add expenses and settle up; there is **no role hierarchy**.

**Goals (MVP)**

1. Create groups, invite via link/email, see each member’s net balance.
2. Add expenses with equal / unequal / percentage / shares splits; optional receipt; simple recurrence.
3. Show simplified “who owes whom,” record settlements, and a cross-group home balance.
4. Live sync of expenses/balances via noirly-realtime so members never need a manual refresh.
5. Ship as a Noirly host: Identity login, Mongo persistence, editorial UI, React Query + Zustand.

**Non-goals (MVP)**

- Admin/approver workflows (Ledger territory)
- Live FX revaluation of historical expenses
- Third-party realtime (Pusher/Ably/Supabase Realtime)
- Expo/React Native in this repo (future mobile will consume the same REST + Bearer + realtime)

**Success criteria**

- Add expense → optimistic UI → server confirm → realtime fan-out → peers update without refresh.
- Balance view always shows a **simplified** settlement set, not raw per-expense edges.
- WCAG AA on editorial light/dark; full keyboard access for expense and settle-up modals.

---

## 2. Project structure

Polyrepo host (like Flow), monorepo-ready: business logic lives under `src/core/` so a future `@noirly-dev/split-core` package can extract without UI churn.

```
noirly-split/
├── auth.ts                          # Auth.js OIDC → Identity
├── middleware.ts                    # Protect (personal)/(group); allow (auth)
├── package.json                     # pnpm; @noirly-dev/realtime-*
├── next.config.ts
├── app/
│   ├── globals.css                  # Editorial tokens + balance semantics
│   ├── layout.tsx                   # Fonts (Hanken, Space, JetBrains), providers
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── realtime/token/route.ts
│   │   ├── me/route.ts
│   │   ├── groups/
│   │   │   ├── route.ts             # GET list, POST create
│   │   │   └── [groupId]/
│   │   │       ├── route.ts         # GET/PATCH/DELETE
│   │   │       ├── members/route.ts
│   │   │       ├── invites/route.ts
│   │   │       ├── expenses/
│   │   │       │   ├── route.ts
│   │   │       │   └── [expenseId]/route.ts
│   │   │       ├── balances/route.ts
│   │   │       ├── settlements/route.ts
│   │   │       ├── activity/route.ts
│   │   │       ├── export/route.ts  # CSV
│   │   │       └── notifications/route.ts
│   │   ├── invites/[token]/route.ts
│   │   └── dashboard/balances/route.ts
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   ├── (personal)/
│   │   ├── layout.tsx               # App shell, realtime provider
│   │   ├── page.tsx                 # Home dashboard
│   │   ├── groups/page.tsx          # All groups
│   │   ├── groups/new/page.tsx
│   │   ├── activity/page.tsx        # Cross-group activity (optional MVP+)
│   │   ├── notifications/page.tsx
│   │   └── settings/page.tsx
│   └── (group)/
│       └── g/[groupId]/
│           ├── layout.tsx           # Group shell + channel subscribe
│           ├── page.tsx             # Expenses list (default)
│           ├── balances/page.tsx
│           ├── activity/page.tsx
│           ├── members/page.tsx
│           ├── settle/page.tsx      # or modal-driven from balances
│           └── expenses/
│               ├── new/page.tsx
│               └── [expenseId]/page.tsx
├── src/
│   ├── core/                        # UI-agnostic (future package extract)
│   │   ├── models/                  # TS interfaces + enums
│   │   ├── money/                   # decimal helpers, FX apply
│   │   ├── splits/                  # equal/unequal/%/shares calculators + Zod
│   │   ├── balances/                # net + greedy simplify
│   │   ├── recurrence/              # next occurrence
│   │   ├── realtime/channels.ts     # splitChannel helpers
│   │   └── sync/query-keys.ts
│   ├── server/
│   │   ├── db/mongodb.ts
│   │   ├── models/                  # Mongoose schemas
│   │   ├── auth/bootstrap.ts
│   │   ├── api/http.ts              # requireSplitSession, jsonOk/jsonError
│   │   ├── realtime/{jwt,publish}.ts
│   │   ├── services/                # groups, expenses, settlements, activity
│   │   └── mappers.ts
│   ├── lib/api-client.ts
│   ├── stores/                      # Zustand (UI only)
│   ├── components/                  # Composed, non-domain
│   │   └── ui/                      # Primitives
│   ├── features/
│   │   ├── auth/
│   │   ├── groups/
│   │   ├── expenses/
│   │   ├── balances/
│   │   ├── settle-up/
│   │   ├── activity/
│   │   ├── notifications/
│   │   └── realtime/
│   └── hooks/
└── docs/
    └── ARCHITECTURE.md
```

**Package manager:** pnpm. Prefer `package-lock` → `pnpm-lock.yaml` when bootstrapping deps.

---

## 3. Data models

IDs are Mongo `ObjectId` strings. Product `User._id` is the app `userId`; `identitySub` links to Identity. Money fields are **integer minor units** (cents) plus ISO currency to avoid float error. Display layer formats with `Intl` + JetBrains Mono.

```ts
/** src/core/models/types.ts */

export type CurrencyCode = string; // ISO 4217, e.g. "USD"
export type MinorAmount = number;  // integer minor units in that currency

export type ExpenseCategory =
  | "food"
  | "travel"
  | "rent"
  | "utilities"
  | "other";

export type SplitMethod = "equal" | "unequal" | "percentage" | "shares";

export type RecurrenceFrequency = "weekly" | "monthly";

export type ActivityType =
  | "expense.added"
  | "expense.updated"
  | "expense.deleted"
  | "settlement.recorded"
  | "member.joined"
  | "group.updated";

export interface User {
  id: string;
  identitySub: string;
  email: string;
  name: string | null;
  image: string | null;
  preferredCurrency: CurrencyCode;
  createdAt: string; // ISO
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  icon: string | null;       // emoji or icon key
  color: string | null;      // hex accent for avatar chip
  baseCurrency: CurrencyCode;
  createdBy: string;         // userId
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
  /** denormalized for list UIs */
  displayName?: string | null;
  image?: string | null;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  token: string;
  email: string | null;      // null = link-only
  createdBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;          // 1 = every week/month
  nextRunAt: string;
  endAt: string | null;
}

export interface Expense {
  id: string;
  groupId: string;
  amount: MinorAmount;       // total in `currency`
  currency: CurrencyCode;
  /** FX into group.baseCurrency at entry; 1 if same currency */
  fxRateToBase: number;
  amountInBase: MinorAmount; // rounded minor units in base
  description: string;
  date: string;              // YYYY-MM-DD (group-local intent)
  category: ExpenseCategory | null;
  receiptUrl: string | null;
  splitMethod: SplitMethod;
  createdBy: string;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  /** set when this row was auto-spawned from a template */
  recurrenceParentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExpensePayer {
  id: string;
  expenseId: string;
  userId: string;
  amountPaid: MinorAmount;   // in expense.currency
  amountPaidInBase: MinorAmount;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amountOwed: MinorAmount;   // in expense.currency
  amountOwedInBase: MinorAmount;
  /** optional inputs for reconstruct/edit */
  percentage: number | null;
  shares: number | null;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;        // payer (reduces their debt)
  toUserId: string;          // payee
  amount: MinorAmount;       // in group.baseCurrency
  currency: CurrencyCode;    // always group.baseCurrency for MVP
  note: string | null;
  settledAt: string;
  createdBy: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: ActivityType;
  actorId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  groupId: string | null;
  type: "expense.added" | "settlement.recorded" | "member.joined";
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

/** Derived — not stored as edges; computed from expenses + settlements */
export interface NetBalance {
  userId: string;
  /** positive = group owes them (they are owed); negative = they owe */
  netInBase: MinorAmount;
}

export interface SimplifiedDebt {
  fromUserId: string;
  toUserId: string;
  amountInBase: MinorAmount;
}
```

### Mongo collections (suggested)

| Collection | Indexes |
|---|---|
| `users` | unique `identitySub`, unique `email` |
| `groups` | `createdBy` |
| `group_members` | unique `(groupId, userId)`, `userId` |
| `group_invites` | unique `token`, `groupId` |
| `expenses` | `groupId + date`, `groupId + deletedAt` |
| `expense_payers` | `expenseId`, `userId` |
| `expense_splits` | `expenseId`, `userId` |
| `settlements` | `groupId + settledAt` |
| `activity_events` | `groupId + createdAt` |
| `notifications` | `userId + createdAt`, `userId + readAt` |

Embed payers/splits on the expense document for read locality if preferred; keep the TypeScript shapes above either way. Recommendation: **embed** `payers[]` and `splits[]` on `Expense` for MVP (one read for expense detail); keep settlements and activity as separate collections.

---

## 4. Balance simplification algorithm

### Netting

For each member `u` in group `G` (base currency):

```
net(u) = Σ (amountPaidInBase for u) − Σ (amountOwedInBase for u) + Σ (settlements to u) − Σ (settlements from u)
```

- `net > 0` → creditor (owed money)  
- `net < 0` → debtor (owes money)  
- `net = 0` → settled

### Greedy settle (minimal display transactions)

1. Partition into creditors `C` and debtors `D` with absolute remaining amounts.
2. Sort both by remaining amount descending.
3. While both non-empty:
   - Take largest creditor `c` and largest debtor `d`.
   - Pay `x = min(c.remaining, d.remaining)`.
   - Emit `{ from: d, to: c, amount: x }`.
   - Subtract `x` from both; drop zeros; re-heap/sort as needed.

This does **not** guarantee the absolute mathematical minimum number of payments in pathological graphs, but for typical roommate/trip sizes it matches user expectations and is what Splitwise-style UIs use. Complexity ~ `O(n log n)` with heaps.

### Worked example

Expenses (all USD, base USD):

| Expense | Paid by | Split |
|---|---|---|
| Dinner $60 | Alex | Equal: Alex, Sam, Jordan |
| Taxi $30 | Sam | Equal: Alex, Sam |
| Groceries $40 | Jordan | Unequal: Alex $10, Sam $10, Jordan $20 |

**Per-person nets**

| Person | Paid | Owes | Net |
|---|---|---|---|
| Alex | 60 | 20+15+10 = 45 | **+15** |
| Sam | 30 | 20+15+10 = 45 | **−15** |
| Jordan | 40 | 20+0+20 = 40 | **0** |

Raw edges would show several small debts. After greedy:

- Debtors: Sam 15  
- Creditors: Alex 15  
- Result: **Sam owes Alex $15** (one line). Jordan disappears.

Add settlement “Sam paid Alex $15 via Venmo” → all nets zero.

### Implementation site

- Pure function: `src/core/balances/simplify.ts` — unit tested.
- Server: `GET .../balances` returns `{ nets, simplified }`.
- Client may recompute from cached expenses for optimistic preview; authoritative nets come from API + realtime invalidation.

---

## 5. API / data layer design

### Backend choice

**MongoDB + Mongoose + Next.js Route Handlers (REST).**

Justification: identical to Flow/Ledger/Pulse; Identity bootstrap by `identitySub`; realtime publish after writes; future mobile uses same routes with Bearer Identity access tokens.

### Auth on API

`requireSplitSession(req)` accepts:

1. Auth.js JWT session cookie, or  
2. `Authorization: Bearer <Identity access token>` (mobile-ready)

Bootstraps/finds local `User` by `identitySub`.

### Error shape

```ts
{ error: string; message: string }
```

Success: domain JSON; lists may include `{ items, nextCursor }`.

### Endpoint map (MVP)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/me` | Current user profile |
| PATCH | `/api/me` | preferredCurrency, name |
| GET | `/api/dashboard/balances` | Cross-group you-owe / you-are-owed totals |
| GET/POST | `/api/groups` | List / create |
| GET/PATCH/DELETE | `/api/groups/:id` | Detail / update / hard-delete (creator; cascades) |
| GET/POST | `/api/groups/:id/members` | List / add (invite accept path) |
| POST | `/api/groups/:id/invites` | Create link or email invite |
| GET/POST | `/api/invites/:token` | Preview / accept |
| GET/POST | `/api/groups/:id/expenses` | List / create |
| GET/PATCH/DELETE | `/api/groups/:id/expenses/:eid` | Detail / edit own / soft-delete |
| GET | `/api/groups/:id/balances` | nets + simplified |
| POST | `/api/groups/:id/settlements` | Record payment |
| GET | `/api/groups/:id/activity` | Feed |
| GET | `/api/groups/:id/export` | CSV download |
| GET | `/api/realtime/token` | Mint 45s realtime JWT with caps |
| GET/PATCH | `/api/notifications` | In-app notifications |

### Client interface (backend-agnostic façade)

```ts
// src/lib/api-client.ts — thin fetch wrapper
// src/core/api/split-api.ts — interface used by hooks

export interface SplitApi {
  listGroups(): Promise<Group[]>;
  createGroup(input: CreateGroupInput): Promise<Group>;
  getBalances(groupId: string): Promise<BalancesResponse>;
  createExpense(groupId: string, input: CreateExpenseInput): Promise<Expense>;
  // ...
}
```

MVP implementation: `HttpSplitApi` → `/api/*`. Tests can inject `MemorySplitApi`.

### Validation

Zod on server (`src/server/api/schemas.ts`) and client (RHF). Split-sum rules live in `src/core/splits/validate.ts` and are shared.

---

## 6. Realtime integration design

### Channel map (`kind:id` only — one colon)

```ts
// src/core/realtime/channels.ts
import { assertChannelName } from "@noirly-dev/realtime-shared";

export const splitChannel = {
  group: (groupId: string) => assertChannelName(`group:${groupId}`),
  user: (userId: string) => assertChannelName(`user:${userId}`),
} as const;
```

| Channel | Subscribers | Purpose |
|---|---|---|
| `group:{groupId}` | Members viewing that group | Expense/settlement/member fan-out |
| `user:{userId}` | That user (app shell) | Notifications, cross-group balance hints |

**Do not** use nested Ledger-style names (`group:id:expense:id`) — they fail the realtime channel regex.

### Caps (host JWT)

For each membership: `group:{id}` → `["subscribe"]`  
For self: `user:{userId}` → `["subscribe"]`  
Publish is **server-only** via `REALTIME_INTERNAL_URL/internal/publish`.

### Event types (dotted strings)

| Event | Channel | `data` (sketch) |
|---|---|---|
| `expense.added` | `group:{id}` | `{ expense }` |
| `expense.updated` | `group:{id}` | `{ expense }` |
| `expense.deleted` | `group:{id}` | `{ expenseId }` |
| `settlement.recorded` | `group:{id}` | `{ settlement }` |
| `member.joined` | `group:{id}` | `{ member }` |
| `group.updated` | `group:{id}` | `{ group }` |
| `balances.stale` | `group:{id}` | `{ groupId }` optional hint |
| `notification.created` | `user:{id}` | `{ notification }` |

After each mutating service call: write Mongo → append `ActivityEvent` → `publishRealtime` → create `Notification` rows for other members → publish on each `user:{id}`.

### Hook usage

```tsx
// features/realtime/GroupRealtime.tsx
useChannel(splitChannel.group(groupId), {
  lastEventId: readLastEventId(groupId),
  replayLimit: 50,
});

useRealtimeEvent(splitChannel.group(groupId), "expense.added", (data) => {
  queryClient.setQueryData(qk.expense(data.expense.id), data.expense);
  void queryClient.invalidateQueries({ queryKey: qk.expenses(groupId) });
  void queryClient.invalidateQueries({ queryKey: qk.balances(groupId) });
  void queryClient.invalidateQueries({ queryKey: qk.dashboardBalances() });
});
```

Provider: `SplitRealtimeProvider` wraps `(personal)` / `(group)` layouts; `autoConnect` after session ready; token from `GET /api/realtime/token`.

### Optimistic → authoritative reconciliation

1. **Mutate:** `useMutation` inserts a temp expense with `clientRequestId` and UI flag `syncStatus: "syncing"`.
2. **HTTP success:** replace temp id with server id; clear syncing; cache matches response.
3. **Realtime echo:** if `expense.id` already in cache, LWW via `shouldApplyLww` / `updatedAt`; ignore stale.
4. **HTTP failure:** rollback cache; toast error.
5. **Peer clients:** no optimistic row; apply `expense.added` directly.

Store `lastEventId` in `sessionStorage` per group (Pulse pattern) for reconnect replay.

---

## 7. State management architecture

### Zustand — UI only

| Store | State |
|---|---|
| `uiStore` | sidebar open, theme override (if any), command palette |
| `expenseDraftStore` | modal open, draft fields while composing (optional; RHF can own form) |
| `settleUpStore` | selected from/to pair prefill from balances row |

No server entities in Zustand.

### React Query — server state

```ts
// src/core/sync/query-keys.ts
export const qk = {
  me: ["me"] as const,
  groups: ["groups"] as const,
  group: (id: string) => ["groups", id] as const,
  members: (groupId: string) => ["members", groupId] as const,
  expenses: (groupId: string) => ["expenses", groupId] as const,
  expense: (id: string) => ["expense", id] as const,
  balances: (groupId: string) => ["balances", groupId] as const,
  activity: (groupId: string) => ["activity", groupId] as const,
  settlements: (groupId: string) => ["settlements", groupId] as const,
  dashboardBalances: () => ["dashboard", "balances"] as const,
  notifications: ["notifications"] as const,
};
```

**Defaults:** `staleTime` 30s for lists; balances invalidated on any expense/settlement mutation or realtime event. Optimistic updates on `createExpense` / `createSettlement`.

---

## 8. Routing structure

### Route groups

| Group | Layout role |
|---|---|
| `(auth)` | Minimal chrome; login only |
| `(personal)` | App shell: nav, notifications bell, realtime user channel |
| `(group)` | Group subnav (Expenses / Balances / Activity / Members) + `GroupRealtime` |

URL prefix `g/[groupId]` keeps group routes short and avoids clashing with `groups` list.

### Routes

| Path | Page |
|---|---|
| `/login` | Continue with Noirly |
| `/` | Dashboard: cross-group balance + recent groups |
| `/groups` | All groups |
| `/groups/new` | Create group |
| `/g/:groupId` | Expense list |
| `/g/:groupId/expenses/new` | Full-page expense entry (also modal on desktop) |
| `/g/:groupId/expenses/:expenseId` | Detail / edit |
| `/g/:groupId/balances` | Nets + simplified debts + Settle up |
| `/g/:groupId/activity` | Activity feed |
| `/g/:groupId/members` | Members + invite |
| `/g/:groupId/settle` | Settle-up flow (optional dedicated route) |
| `/notifications` | In-app notifications |
| `/settings` | Profile / preferred currency |
| `/invites/:token` | Accept invite (can live under `(auth)` or personal) |

### Middleware

```ts
// middleware.ts — matcher excludes /api/auth, static
// Unauthenticated → /login?callbackUrl=...
// Authenticated on /login → /
```

API routes enforce session themselves (middleware does not replace `requireSplitSession`).

---

## 9. Component inventory

### Primitives — `src/components/ui/`

| Component | Notes |
|---|---|
| `Button`, `IconButton` | Panel/ink variants |
| `Input`, `Textarea`, `Select` | RHF-friendly |
| `Dialog` / `Sheet` | Focus trap, Esc, return focus |
| `MoneyText` | JetBrains Mono + tabular nums |
| `Avatar`, `Badge` | Member chips |
| `Tabs`, `Tooltip` | |
| `Spinner` / `BusyDots` | Reuse Flow busy pattern |
| `FormField`, `ErrorMessage` | |

### Composed — `src/components/`

| Component | Role |
|---|---|
| `AppShell`, `GroupShell` | Nav layouts |
| `EmptyState` | |
| `ConfirmDialog` | Destructive delete |
| `DotMatrix` | Editorial accent (shared DNA) |

### Features

**`features/groups/`**

- `GroupCard`, `CreateGroupForm`, `GroupHeader`
- `MemberList`, `MemberBalanceRow`, `InvitePanel` (link copy + email)

**`features/expenses/`**

- `ExpenseList`, `ExpenseRow`, `ExpenseDetail`
- `ExpenseForm` (RHF + Zod)
- `SplitMethodPicker` — equal | unequal | % | shares
- `SplitAllocationEditor` — per-member inputs + live remainder
- `SplitPreview` — “Alex $20 · Sam $20 · …” as you type
- `PayerEditor` — one or many payers
- `CategoryPicker`, `ReceiptUpload`
- `RecurrenceFields`
- `ExpenseSyncBadge` — syncing / synced

**`features/balances/`**

- `BalanceSummary` — your net in this group
- `SimplifiedDebtList` — “Sam owes Alex $15”
- `NetByMemberList`

**`features/settle-up/`**

- `SettleUpDialog` — from, to, amount (default = simplified edge), note, confirm
- Prefill from debt row click

**`features/activity/`**

- `ActivityFeed`, `ActivityItem` (typed copy)

**`features/notifications/`**

- `NotificationBell`, `NotificationList`

**`features/realtime/`**

- `SplitRealtimeProvider`, `GroupRealtime`, `RealtimeStatusDot`

**`features/auth/`**

- `NoirlyLoginButton`, `SignOutButton` (copy Flow)

---

## 10. Authentication flow

```
User → /login → NoirlyLoginButton
  → Identity authorize (OIDC: pkce + state + nonce)
  → Auth.js callback → JWT session cookie
  → bootstrap User by identitySub
  → redirect callbackUrl or /
```

- **No Split-local passwords or Google provider.** Identity owns those.
- **No group roles.** Authorization = “is `GroupMember`?” for all expense/settle operations. Edit/delete expense: creator only (MVP); settlements: any member may record.
- Register OIDC client `noirly-split` in Identity (`AUTH_NOIRLY_CLIENT_ID` / `SECRET`, issuer).
- Sign-out: Auth.js `signOut` + cookie sweep (Flow `actions.ts` pattern).

Env (dev ports follow platform): Identity `:3000`, Split suggest `:3005`, realtime WS `:4001`.

---

## 11. Design system tokens

Match Flow/Identity editorial system. **Do not** reintroduce legacy `#52D3FE` / `#121212` as the product theme. Add **semantic balance** tokens that work on canvas/ink.

### CSS variables (`app/globals.css`)

```css
:root {
  color-scheme: light;
  --canvas: #f5f5f5;
  --ink: #000000;
  --muted: rgb(0 0 0 / 0.45);
  --panel: #000000;
  --panel-ink: #f5f5f5;
  --hairline: #000000;
  --surface: #ececec;

  /* Balance semantics — AA on canvas */
  --balance-positive: #0a7a45; /* you are owed */
  --balance-negative: #a65f00; /* you owe */
  --balance-zero: var(--muted);
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --canvas: #000000;
    --ink: #f5f5f5;
    --muted: rgb(245 245 245 / 0.45);
    --panel: #f5f5f5;
    --panel-ink: #000000;
    --hairline: #f5f5f5;
    --surface: #0d0d0d;

    --balance-positive: #3dd68c;
    --balance-negative: #e8a23a;
  }
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-panel: var(--panel);
  --color-panel-ink: var(--panel-ink);
  --color-hairline: var(--hairline);
  --color-surface: var(--surface);
  --color-balance-positive: var(--balance-positive);
  --color-balance-negative: var(--balance-negative);
  --color-balance-zero: var(--balance-zero);
  --font-sans: var(--font-hanken);
  --font-display: var(--font-space);
  --font-mono: var(--font-jetbrains);
}
```

### Typography

| Role | Font |
|---|---|
| UI / body | Hanken Grotesk (`--font-sans`) |
| Display / group titles | Space Grotesk (`--font-display`) |
| **All money & balances** | JetBrains Mono (`MoneyText`, `.matrix-numeral`) |

### Spacing / radii / shadows

- Spacing scale: Tailwind defaults (4px grid); prefer generous section padding (`p-6` / `md:p-10`).
- Radii: mostly sharp editorial (0–4px); dialogs may use `rounded-sm`.
- Shadows: none or single hairline border; avoid soft multi-layer glow.
- Borders: `border-hairline` / dashed ticket motifs where Flow uses them.

### Motion

- Expense row enter: short fade/slide (150–200ms).
- Split preview numbers: tabular, no layout jump.
- Settle confirm: busy dots on submit.

---

## 12. Key interaction specs

### A. Expense entry + live split preview

1. Open `ExpenseForm` (dialog on desktop ≥ md, full page on mobile).
2. Fields: amount (mono), currency (default group base), description, date, category, paid-by.
3. `SplitMethodPicker` default **equal**.
4. On every amount / method / member toggle change:
   - Run `calculateSplits(...)`.
   - `SplitPreview` updates immediately.
   - Zod superRefine: unequal sums === total; percentages === 100; shares > 0.
5. Remainder helper for unequal: “$2 left to assign” / “$2 over”.
6. Submit disabled until valid; aria-live polite region announces preview totals.
7. On submit: optimistic row with syncing badge → POST → reconcile.

**A11y:** Dialog `aria-labelledby`, focus first amount field, Tab cycles payers/splits, Esc closes with confirm if dirty, restore focus to trigger.

### B. Settle-up flow

1. From Balances, click simplified row “Sam owes Alex $15” → opens `SettleUpDialog` prefilled.
2. Or choose any from/to pair manually.
3. Amount defaults to simplified edge; editable (partial settle allowed).
4. Optional note (“Venmo”, “cash”).
5. Confirm → optimistic net update → POST settlement → realtime → activity “Sam settled $15 with Alex”.

**A11y:** Same dialog focus rules; announce new balance via aria-live after success.

### C. Balance simplification display

- Primary list: **simplified debts** only (empty state: “Everyone is settled”).
- Secondary/disclosure: “Net by member” for transparency.
- Your row highlighted; positive/negative use `text-balance-positive` / `text-balance-negative` + `MoneyText`.
- Dashboard home: aggregate `sum(max(net,0))` across groups as “You are owed” and `sum(min(net,0))` as “You owe” (in preferred or mixed—MVP: convert each group net with locked rates already in base, then sum bases only if same currency; else show per-currency totals or convert with user’s preferredCurrency using latest locked rates table—**MVP: show totals only when all groups share one base, otherwise list per-group nets**).

---

## 13. Multi-currency handling

### Policy (MVP): lock rate at entry

When `expense.currency !== group.baseCurrency`:

1. Resolve `fxRateToBase` from a static/daily rates table (ECB/open source feed cached server-side) **or** user-entered rate.
2. Persist `fxRateToBase`, `amountInBase`, and per-payer/split `*InBase` on write.
3. All balances and settlements use **group.baseCurrency** only.
4. UI shows: `$50 CAD ≈ $36.40 USD` (group base) under the amount.

**Why not live revaluation:** Changing yesterday’s dinner because USD/CAD moved breaks trust and settlement history. Travel apps that revalue are the exception; Splitwise-style social ledgers lock the rate.

**v1+:** Optional “update open balances with new rate” is an explicit user action, never silent.

### Settlement currency

MVP settlements always in `group.baseCurrency`. Cross-currency settlement is out of scope.

---

## 14. Phased build roadmap

### MVP

- Identity OIDC login + user bootstrap  
- Groups CRUD, invites (link), members  
- Expenses: equal + unequal; single payer; categories; soft delete  
- Balances: nets + greedy simplify  
- Settle-up + activity feed  
- Realtime `group:{id}` for expense/settlement events  
- React Query optimistic create expense  
- Editorial UI responsive shell  
- CSV export  

### v1

- Percentage + shares splits; multi-payer  
- Receipt upload (S3/R2)  
- Recurring expenses (weekly/monthly job or on-read spawn)  
- Email invites + in-app notifications (`user:{id}` channel)  
- Expense edit with split recompute  
- Dashboard multi-group balance (preferred currency display)  
- Invite accept landing polish  

### v2

- Mobile client (Bearer + same API + realtime)  
- Shared `@noirly-dev/split-core` package extraction  
- Partial settlement suggestions / payment app deep links (non-custodial)  
- FX rate admin / manual override UX  
- Search, filters, category reports  
- Soft group archive + hard delete (creator) + leave group
- Product surface: Groups CRUD + Expenses CRUD (settings/invite under group)  
- Presence on group channel (“Alex is adding an expense”)  

---

## Appendix A — Env checklist

```
AUTH_NOIRLY_ISSUER=
AUTH_NOIRLY_CLIENT_ID=
AUTH_NOIRLY_CLIENT_SECRET=
AUTH_SECRET=
MONGODB_URI=
REALTIME_JWT_SECRET=
REALTIME_JWT_ISSUER=noirly-split
REALTIME_JWT_AUDIENCE=noirly-realtime
REALTIME_INTERNAL_URL=
REALTIME_INTERNAL_SECRET=
NEXT_PUBLIC_REALTIME_WS_URL=
```

## Appendix B — Core pure modules (test first)

| Module | Responsibility |
|---|---|
| `core/splits/*` | Calculators + Zod sum invariants |
| `core/balances/net.ts` | Net from payers/splits/settlements |
| `core/balances/simplify.ts` | Greedy settle |
| `core/money/*` | Minor-unit math, FX apply, format |
| `core/recurrence/next.ts` | Next weekly/monthly occurrence |

Build these with Vitest before wiring UI — they are the product’s correctness core.

---

*Document owner: Principal Frontend Architecture — Noirly Split*  
*Aligned with: noirly-identity, noirly-realtime, noirly-flow, noirly-ledger, noirly-pulse*
