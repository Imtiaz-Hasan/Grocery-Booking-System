# Grocery Booking System

A production-grade RESTful backend for a grocery booking system, built with **Node.js**, **Express**, **PostgreSQL** (via **Sequelize**), and **JWT-based authentication** with role-based access control. The application is fully **Dockerized** for one-command setup.

> Assessment submission for the **Senior Software Engineer (Node.js)** role at QuestionPro.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture & Project Structure](#architecture--project-structure)
4. [Database Schema](#database-schema)
5. [Quick Start (Docker - Recommended)](#quick-start-docker--recommended)
6. [Quick Start (Local without Docker)](#quick-start-local-without-docker)
7. [Environment Variables](#environment-variables)
8. [API Reference](#api-reference)
9. [Concurrency & Inventory Safety](#concurrency--inventory-safety)
10. [Security Considerations](#security-considerations)
11. [Sample cURL Requests](#sample-curl-requests)
12. [Possible Improvements](#possible-improvements)

---

## Features

### Roles
- **Admin** - manage the catalog and inventory.
- **User** - browse the catalog and place multi-item orders.

### Admin Capabilities
- Add new grocery items
- View all grocery items (including inactive / out-of-stock) with pagination, search, filters, sorting
- Update grocery details (name, description, price, category, unit, active state)
- Remove grocery items (hard delete)
- Manage inventory levels via dedicated endpoint (`set` / `increment` / `decrement`)
- View all customer orders

### User Capabilities
- Register & log in (JWT)
- View available grocery items (only active items returned by default)
- Place a single order containing **multiple grocery items** with quantities
- View order history & order details

### Engineering Highlights
- **Layered architecture** - routes → middleware → controllers → services/models
- **JWT auth** with role-based middleware (`authorize('admin')`)
- **Joi** request validation (body, query, params)
- **Atomic order placement** with `SELECT … FOR UPDATE` row locks (no overselling under concurrent orders)
- **Centralized error handling** that maps Sequelize errors to clean API errors
- **Structured logging** with Winston
- **Helmet, CORS, compression, rate-limiting** out of the box
- **Pagination, filtering, sorting** on list endpoints
- **Docker multi-stage build** with non-root user, Tini as PID 1, and a healthcheck
- **docker-compose** orchestrates the API + PostgreSQL with a healthcheck dependency
- **Auto-bootstraps a default admin** on first run (seedable demo data via a profile)

---

## Tech Stack

| Layer            | Choice                          |
| ---------------- | ------------------------------- |
| Runtime          | Node.js 20 (LTS)                |
| Framework        | Express 4                       |
| Database         | PostgreSQL 16                   |
| ORM              | Sequelize 6                     |
| Auth             | JSON Web Tokens (jsonwebtoken)  |
| Hashing          | bcryptjs                        |
| Validation       | Joi                             |
| Logging          | Winston + Morgan                |
| Security         | Helmet, CORS, express-rate-limit|
| Container        | Docker (multi-stage) + compose  |

---

## Architecture & Project Structure

```
.
├── Dockerfile
├── docker-compose.yml
├── package.json
├── .env.example
├── README.md
└── src/
    ├── app.js                 # Express app (middleware chain, routes wiring)
    ├── server.js              # HTTP server bootstrap, graceful shutdown
    ├── config/
    │   ├── index.js           # Centralised env-driven config
    │   └── database.js        # Sequelize instance + retrying connect
    ├── models/
    │   ├── index.js           # Model registry + associations
    │   ├── user.model.js
    │   ├── grocery.model.js
    │   ├── order.model.js
    │   └── orderItem.model.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── grocery.controller.js
    │   └── order.controller.js
    ├── routes/
    │   ├── index.js
    │   ├── auth.routes.js
    │   ├── grocery.routes.js
    │   └── order.routes.js
    ├── middleware/
    │   ├── auth.middleware.js     # authenticate + authorize(...roles)
    │   ├── validate.middleware.js # Joi validator
    │   └── error.middleware.js    # Centralised error handler
    ├── validators/
    │   ├── auth.validator.js
    │   ├── grocery.validator.js
    │   └── order.validator.js
    ├── services/
    │   └── token.service.js
    ├── utils/
    │   ├── apiError.js
    │   ├── apiResponse.js
    │   ├── asyncHandler.js
    │   ├── pagination.js
    │   └── logger.js
    └── scripts/
        ├── bootstrap.js       # Auto-creates default admin on first start
        ├── migrate.js         # `sequelize.sync` runner (with --alter / --force)
        └── seed.js            # Seeds demo grocery items
```

### Request lifecycle

```
HTTP request
   │
   ▼
helmet · cors · compression · json · rateLimit · morgan
   │
   ▼
route → validate(Joi) → authenticate(JWT) → authorize(role)
   │
   ▼
controller (async) → models / services
   │
   ▼
errorHandler (Sequelize → ApiError) → JSON response
```

---

## Database Schema

```
┌──────────────┐            ┌──────────────┐
│    users     │            │  groceries   │
├──────────────┤            ├──────────────┤
│ id (PK,UUID) │            │ id (PK,UUID) │
│ name         │            │ name (UQ)    │
│ email (UQ)   │            │ description  │
│ password     │            │ category     │
│ role(enum)   │            │ unit         │
│ is_active    │            │ price (10,2) │
│ timestamps   │            │ stock (int)  │
└──────┬───────┘            │ is_active    │
       │1                   │ timestamps   │
       │                    └──────┬───────┘
       │N                          │1
┌──────▼───────┐            ┌──────▼───────────┐
│   orders     │ 1        N │   order_items    │
├──────────────┤────────────├──────────────────┤
│ id (PK,UUID) │            │ id (PK,UUID)     │
│ user_id (FK) │            │ order_id (FK)    │
│ total_amount │            │ grocery_id (FK)  │
│ status(enum) │            │ item_name        │
│ timestamps   │            │ quantity         │
└──────────────┘            │ unit_price       │
                            │ subtotal         │
                            │ timestamps       │
                            └──────────────────┘
```

- `order_items.item_name` and `unit_price` are **snapshotted** at order-time so historical orders remain stable even if the catalog price changes later.
- `users.role` is a Postgres `enum('admin', 'user')`.
- `orders.status` is a Postgres `enum('pending', 'confirmed', 'cancelled')`. Orders are created with `confirmed` status when stock deduction succeeds.

---

## Quick Start (Docker - Recommended)

### Prerequisites
- Docker Desktop (Linux containers) / Docker Engine 24+
- Docker Compose v2

### 1. Clone & configure
```bash
git clone <your-repo-url>
cd "Grocery Booking System"
cp .env.example .env
```
Adjust values in `.env` if you wish (the defaults work for local development).

### 2. Start the stack
```bash
docker compose up --build -d
```

This brings up:
- `grocery_db` - PostgreSQL 16 (port `5432`)
- `grocery_api` - Node.js API on port `3000`

The API auto-creates tables (`sync({ alter: true })` in dev) and bootstraps a default admin on first run.

### 3. (Optional) Load demo grocery items
```bash
docker compose --profile seed run --rm seed
```

### 4. Verify
```bash
curl http://localhost:3000/api/v1/health
# → { "success": true, "status": "ok", "timestamp": "..." }
```

### Default admin credentials
```
email:    admin@grocery.local
password: Admin@12345
```
> ⚠️ Change these via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars before any non-local deployment.

### Stop the stack
```bash
docker compose down            # keep data volume
docker compose down -v         # also remove the postgres volume
```

---

## Quick Start (Local without Docker)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run a local PostgreSQL 14+ instance and create a database:
   ```sql
   CREATE DATABASE grocery_booking;
   ```
3. Copy env file and update DB credentials:
   ```bash
   cp .env.example .env
   ```
4. Start the API in dev mode (auto-reload):
   ```bash
   npm run dev
   ```
5. (Optional) Seed sample data:
   ```bash
   npm run db:seed
   ```

---

## Environment Variables

| Variable                  | Default                           | Description                                   |
| ------------------------- | --------------------------------- | --------------------------------------------- |
| `NODE_ENV`                | `development`                     | `development` / `production` / `test`         |
| `PORT`                    | `3000`                            | HTTP port                                     |
| `API_PREFIX`              | `/api/v1`                         | API base path                                 |
| `DB_HOST`                 | `localhost` (compose: `db`)       | PostgreSQL host                               |
| `DB_PORT`                 | `5432`                            | PostgreSQL port                               |
| `DB_NAME`                 | `grocery_booking`                 | Database name                                 |
| `DB_USER`                 | `postgres`                        | Database user                                 |
| `DB_PASSWORD`             | `postgres`                        | Database password                             |
| `DB_LOGGING`              | `false`                           | Log SQL statements                            |
| `JWT_SECRET`              | _required in production_          | HS256 signing secret                          |
| `JWT_EXPIRES_IN`          | `1d`                              | Access token TTL                              |
| `BCRYPT_SALT_ROUNDS`      | `10`                              | bcrypt cost factor                            |
| `RATE_LIMIT_WINDOW_MS`    | `900000` (15m)                    | Rate limit window                             |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                             | Max requests per window per IP                |
| `ADMIN_EMAIL`             | `admin@grocery.local`             | Bootstrap admin email                         |
| `ADMIN_PASSWORD`          | `Admin@12345`                     | Bootstrap admin password                      |
| `ADMIN_NAME`              | `Default Admin`                   | Bootstrap admin display name                  |

---

## API Reference

> Base URL: `http://localhost:3000/api/v1`
> Authenticated routes require the header: `Authorization: Bearer <token>`

### Health
| Method | Path        | Description       |
| ------ | ----------- | ----------------- |
| GET    | `/health`   | Liveness probe    |

### Auth
| Method | Path             | Auth | Body                                    | Description                |
| ------ | ---------------- | ---- | --------------------------------------- | -------------------------- |
| POST   | `/auth/register` | -    | `{ name, email, password }`             | Register a regular user    |
| POST   | `/auth/login`    | -    | `{ email, password }`                   | Returns `{ user, token }`  |
| GET    | `/auth/me`       | ✅   | -                                       | Current authenticated user |

### Groceries - User-facing
| Method | Path                | Auth | Description                                          |
| ------ | ------------------- | ---- | ---------------------------------------------------- |
| GET    | `/groceries`        | ✅   | List active groceries (paginated, filterable)        |
| GET    | `/groceries/:id`    | ✅   | Get a single active grocery                          |

**Query params** (list): `page`, `limit`, `search`, `category`, `inStock`, `sortBy` (`name`/`price`/`stock`/`createdAt`), `sortOrder` (`asc`/`desc`).

### Groceries - Admin
| Method | Path                              | Auth | Description                          |
| ------ | --------------------------------- | ---- | ------------------------------------ |
| POST   | `/groceries`                      | 🔒admin | Create grocery                    |
| GET    | `/groceries/admin/all`            | 🔒admin | List ALL groceries (incl inactive)|
| PATCH  | `/groceries/:id`                  | 🔒admin | Update grocery details            |
| DELETE | `/groceries/:id`                  | 🔒admin | Delete grocery                    |
| PATCH  | `/groceries/:id/inventory`        | 🔒admin | Manage stock                      |

`PATCH /groceries/:id/inventory` body:
```json
{ "operation": "set" | "increment" | "decrement", "quantity": 50 }
```

### Orders - User
| Method | Path           | Auth | Body                              | Description                       |
| ------ | -------------- | ---- | --------------------------------- | --------------------------------- |
| POST   | `/orders`      | ✅   | `{ items: [{ groceryId, quantity }] }` | Place a multi-item order   |
| GET    | `/orders`      | ✅   | -                                 | My order history (paginated)      |
| GET    | `/orders/:id`  | ✅   | -                                 | My single order                   |

### Orders - Admin
| Method | Path                  | Auth   | Description           |
| ------ | --------------------- | ------ | --------------------- |
| GET    | `/orders/admin/all`   | 🔒admin | All orders + buyer  |
| GET    | `/orders/admin/:id`   | 🔒admin | Any order            |

### Standard response shape
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data":  { ... },
  "meta":  { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

Errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "field": "items.0.quantity", "message": "\"quantity\" must be >= 1" }]
}
```

---

## Concurrency & Inventory Safety

Placing an order is a **single database transaction**. The transaction:

1. Locks all referenced grocery rows with `SELECT … FOR UPDATE` (Sequelize: `lock: t.LOCK.UPDATE`).
2. Validates that every item exists, is active, and has sufficient stock.
3. Decrements stock atomically.
4. Creates the `order` row and bulk-inserts `order_items`.
5. Commits - or rolls back the entire change on any failure.

Because the rows are locked for the duration of the transaction, two simultaneous orders for the same item cannot both pass the stock check; the second waits for the first to commit and re-reads the updated stock. **Overselling is prevented under concurrent load.**

`order_items` snapshots `unit_price` and `item_name` at booking time - historical orders are immutable to later catalog edits.

---

## Security Considerations

- **Password hashing** - `bcrypt` with configurable salt rounds (default 10).
- **JWT** - HS256, configurable secret, configurable TTL. Tokens carry `sub` (user id) and `role` only.
- **Helmet** - sensible secure HTTP headers by default.
- **Rate limiting** - per-IP sliding window across the API surface.
- **Input validation** - every body / query / params payload is validated with Joi before reaching a controller.
- **Sequelize parameterised queries** - protection against SQL injection.
- **No `x-powered-by`** header.
- **Non-root container user** (`app`) and **Tini** as PID 1 for proper signal handling.
- Sensitive fields (`password`) are stripped via `User.toJSON()`.

---

## Sample cURL Requests

> Replace `$TOKEN` with the JWT returned from login.

```bash
# 1. Log in as admin
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@grocery.local","password":"Admin@12345"}'

# 2. Admin creates a grocery item
curl -s -X POST http://localhost:3000/api/v1/groceries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mango (Alphonso)",
    "category": "Fruits",
    "unit": "kg",
    "price": 6.49,
    "stock": 100,
    "description": "Premium Alphonso mangoes"
  }'

# 3. Admin manages inventory (increment by 50)
curl -s -X PATCH http://localhost:3000/api/v1/groceries/<GROCERY_ID>/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operation":"increment","quantity":50}'

# 4. Register a regular user
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"Pass1234"}'

# 5. User browses groceries
curl -s "http://localhost:3000/api/v1/groceries?inStock=true&sortBy=price&sortOrder=asc" \
  -H "Authorization: Bearer $USER_TOKEN"

# 6. User books multiple items in a single order
curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "groceryId": "<MANGO_ID>", "quantity": 2 },
      { "groceryId": "<MILK_ID>",  "quantity": 1 }
    ]
  }'

# 7. User views their order history
curl -s http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $USER_TOKEN"
```

A ready-to-import HTTP collection lives in [`postman_collection.json`](./postman_collection.json).

---

## Possible Improvements

If this were extended for production beyond the scope of the assessment, these would be the next steps:

- **Refresh tokens** with a revocation list (Redis) for longer-lived sessions
- **Soft deletes** on groceries (`paranoid: true`) so historical orders preserve full FK integrity
- **Order cancellation** flow that returns stock to inventory in a transaction
- **Idempotency keys** on `POST /orders` to safely retry under network hiccups
- **OpenAPI/Swagger** spec at `/docs` (using `swagger-jsdoc` + `swagger-ui-express`)
- **Sequelize migrations via Umzug/CLI** (instead of `sync`) for production schema control
- **Integration tests** with a disposable Postgres (Testcontainers) covering the order race condition
- **CI pipeline** (GitHub Actions) running lint + tests + image build
- **Observability** - Prometheus metrics, OpenTelemetry tracing, structured request IDs

---

## License

ISC. Created as a take-home assessment for QuestionPro.
