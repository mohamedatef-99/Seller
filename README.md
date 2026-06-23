# COD Tracker — backend skeleton

COD cash tracker for Egyptian IG/TikTok sellers. One dashboard showing every
order's status plus **COD collected vs. COD still owed right now**.

This is **Phase 1: backend skeleton** — NestJS + Prisma + Postgres + auth + data
model + seed data. Orders/dashboard/courier endpoints and the Angular app come
next.

## Stack

- **API:** NestJS (TypeScript), REST, Prisma ORM, Postgres, JWT auth (argon2)
- **Shared:** `@cod/shared` — enums + DTO types reused by api and (later) web
- **Monorepo:** npm workspaces (`packages/shared`, `packages/api`, `packages/web` later)

## Layout

```
cod-tracker/
  docker-compose.yml        # Postgres 16
  .env.example              # copy to .env
  packages/
    shared/                 # @cod/shared — OrderStatus/CodStatus enums + DTOs
    api/                    # NestJS app
      prisma/schema.prisma  # data model
      prisma/seed.ts        # demo seller + 6 products + 15 orders
      src/
        auth/               # signup/login, JWT, argon2, current-seller guard
        sellers/            # seller profile
        prisma/             # PrismaService (global)
```

## Run it locally

Prereqs: Node 18+, Docker (for Postgres).

```bash
# 1. Install everything (root)
npm install

# 2. Env — TWO files:
cp .env.example .env                      # root: docker-compose (Postgres)
cp packages/api/.env.example packages/api/.env   # api: Prisma + Nest read from here
#   (the api reads .env from its own dir, not the repo root)

# 3. Start Postgres
npm run db:up

# 4. Build shared types (api imports @cod/shared)
npm run build:shared

# 5. Create the database schema (first migration)
npm run db:migrate            # name it e.g. "init" when prompted

# 6. Seed demo data (1 seller, 6 products, 15 orders across all statuses)
npm run db:seed

# 7. Run the API
npm run start:api             # http://localhost:3000/api
```

Reset the DB + reseed any time: `npm run db:reset` (drops, re-migrates, reseeds).

## Run the web app (Angular 20 PWA)

Prereqs: **Node 20+** (Angular 20 requires it — the API is fine on 18, but the
web app is not). Keep the API running from the steps above, then:

```bash
# from repo root — make sure shared types are built first
npm run build:shared

# start the Angular dev server
npm run start:web            # http://localhost:4200
```

Open http://localhost:4200, log in with the demo account below, and you land on
the money dashboard against the seeded data.

- **RTL-first / Arabic primary**, mobile-first, Tailwind-styled.
- **PWA**: production builds register a service worker + manifest so sellers can
  install it to the home screen. (Add real icons in `packages/web/public/icons/`
  — `icon-192.png`, `icon-512.png` — before shipping.)
- Hero number = **"فلوس عندك عند شركة الشحن دلوقتي"** (COD collected but not yet
  settled to you) — the core pain, front and center.

## Demo login

After seeding:

```
email:    demo@cod.eg
password: password123
```

## Smoke-test the API

```bash
# login -> grab accessToken
curl -s localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@cod.eg","password":"password123"}'

# authenticated profile
curl -s localhost:3000/api/sellers/me -H "authorization: Bearer <TOKEN>"
```

## Data model notes

- **`Order.codAmount`** is snapshotted at creation (= items + shipping), so the
  money view never depends on live product prices.
- **`OrderItem.unitPrice` / `productName`** are also snapshots.
- **`CodLedger`** is **1:1 with Order** — one state row per order
  (`expected` / `collected` / `settled` + `CodStatus`). The money view is three
  SUMs over this table. Not an append-only event log (deliberate, for v1 speed);
  if partial collections or remittance batches are needed later, we add a
  `CodEvent` table without touching this.

## Status enums

`OrderStatus`: NEW · PENDING · IN_TRANSIT · DELIVERED · RETURNED · CANCELLED
`CodStatus`: PENDING · COLLECTED · SETTLED

## Built so far

- ✅ Backend skeleton: NestJS + Prisma + Postgres + JWT auth + data model + seed
- ✅ **Money + orders dashboard** — `GET /api/dashboard` (seller-scoped) +
  Angular money screen
- ✅ **Fast order entry** — `POST /api/orders` (snapshots prices, computes COD,
  creates order + items + ledger atomically) + the ~15-second entry screen at
  `/orders/new`.
- ✅ **Product catalog** — add once, reuse. `POST` + `PATCH /api/products` +
  catalog screen at `/products` (add, edit name/price, activate/deactivate).
  Inactive products stay hidden from the order picker but visible in the catalog.
- ✅ **Courier push** — `POST /api/orders/:id/push` moves a NEW order to PENDING
  and stores the tracking number. One-tap "إرسال للشحن" on NEW order cards.
- ✅ **Real Bosta integration** — per-seller Bosta account, key encrypted at rest
  (AES-256-GCM). Real `createDelivery` + status polling against Bosta's API
  (endpoints/auth confirmed from their official Node SDK). Status sync advances
  orders and **auto-collects the COD ledger on delivery**. Falls back to a stub
  when a seller hasn't connected a key, so dev still works end-to-end.

## API endpoints

```
POST  /api/auth/signup       create seller
POST  /api/auth/login        -> { accessToken, seller }
GET   /api/sellers/me        current seller                   (JWT)
GET   /api/dashboard         summary + orders                 (JWT)
GET   /api/products          active products                  (JWT)
       ?includeInactive=true  all products (catalog)
POST  /api/products          create product                   (JWT)
PATCH /api/products/:id       update name/price/sku/isActive   (JWT)
POST  /api/orders            create order, returns OrderDto    (JWT)
POST  /api/orders/:id/push    push NEW order to courier         (JWT)
POST  /api/orders/sync        pull Bosta status for active orders (JWT)
POST   /api/sellers/me/bosta  connect Bosta (validate + encrypt) (JWT)
DELETE /api/sellers/me/bosta  disconnect Bosta                   (JWT)
```

## Connecting Bosta (real integration)

Each seller connects their **own** Bosta account on the Settings screen
(`/settings`). The flow:

1. Seller pastes their Bosta API key + picks env (staging/production).
2. API validates the key against Bosta (`GET /api/v0/cities`), then stores it
   **AES-256-GCM encrypted** (`COURIER_ENCRYPTION_KEY` derives the 32-byte key).
   The key is never returned to the browser.
3. "إرسال للشحن" now calls the real Bosta `POST /api/v0/deliveries`; the returned
   tracking number is stored on the order.
4. "تحديث الحالة" on the dashboard polls Bosta for active orders and applies
   status changes — and when an order is **Delivered**, the COD ledger advances
   to **COLLECTED** automatically (the owed-vs-collected view stays live).

Bosta state → our status mapping lives in `src/courier/bosta.adapter.ts`. The
sync logic (`OrdersService.syncActive`) is a plain service, so a cron job or a
Bosta webhook can drive the exact same path later.

**City mapping:** `dropOffAddress.city` needs a Bosta city code (e.g. `EG-01`).
The adapter resolves the order's governorate to that code via `GET /api/v0/cities`
(cached 12h), with exact + alias + fuzzy name matching — all 27 governorates map,
including Bosta's spelling differences (Sharqia→Sharkia, Faiyum→Fayoum, etc.). If
a governorate ever fails to resolve, the error says so and you add one line to
`GOVERNORATE_ALIASES`. Note: zone-level precision isn't sent yet (we only have a
free-text address line) — if Bosta requires a zone for some cities, that needs a
zone picker in the order form.

## Courier adapter (swappable)

`src/courier/` holds the seam for couriers:

- `courier-adapter.ts` — `CourierAdapter` interface (`createShipment`,
  `getStatus`) + the `COURIER_ADAPTER` DI token.
- `bosta.adapter.ts` — **stub** implementation returning mock tracking numbers.
- `courier.module.ts` — binds `COURIER_ADAPTER` → `BostaAdapter`.

Adding Mylerz/R2S later = write another class implementing `CourierAdapter` and
change the `useClass` binding. Consumers (`OrdersService`) inject the token, never
a concrete adapter. The real Bosta phase replaces the stub body: read the
encrypted API key from config (server-side only), call Bosta's API, map their
status into our `OrderStatus`.

## Web routes

`/login` · `/dashboard` (money view + sync + FAB) · `/orders/new` ·
`/products` · `/settings` (connect Bosta)

## What's next (separate phase — real Bosta)

The whole v1 in-scope loop is built and works end-to-end against seed data. The
only remaining work is the **real Bosta integration**: replace the `BostaAdapter`
stub body with live API calls (encrypted key from config), and add status
sync via `getStatus`. Everything else (out-of-scope list) stays out of v1.

## Dashboard money buckets

`GET /api/dashboard` returns a `summary` plus the seller's orders. The summary
splits "owed" into honest buckets instead of one fuzzy total:

- `codStillOwed` (**headline**) — collected by courier, **not** yet settled →
  the shipping company is holding your cash right now.
- `codInTransit` — expected cash on orders still out for delivery (PENDING +
  IN_TRANSIT), not collected yet.
- `codCollected` — total collected from customers (COLLECTED + SETTLED).
- `codSettled` — already paid out to you.
- `ordersOut` / `delivered` — counts.

Against the seed data these come out to: still owed **EGP 2,995**, in transit
**EGP 3,870**, collected **EGP 5,175**, settled **EGP 2,180**, orders out **5**,
delivered **5**. (Verified by replicating the aggregation over the seed.)

## Out of scope for v1 (intentionally)

Storefront/checkout, IG DM automation, multiple couriers, payments/wallet, deep
inventory, returns flow, team accounts, analytics beyond the money view.
