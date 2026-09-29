# afaq-khan

AI Chat + Subscription Bundle backend built with **NestJS**, **TypeScript**, **Prisma**, and **PostgreSQL**.

Clean Architecture (DDD-style) with independent `users`, `chat`, and `subscriptions` modules.

## Features

### AI Chat
- Accepts a user question and returns a **mocked OpenAI** answer (1–2s simulated delay)
- Persists question, answer, and token counts
- **3 free messages per user per calendar month** (UTC; resets implicitly on the 1st via a new monthly usage row)
- After free quota: requires an **ACTIVE** subscription with remaining messages
- Multiple active bundles supported; usage is deducted from the bundle with the **highest remaining quota** (newest wins ties; Enterprise = unlimited)
- Structured `QUOTA_EXCEEDED` error (HTTP 402) when over limit

### Subscriptions
- Create **Basic** (10), **Pro** (100), or **Enterprise** (unlimited) bundles
- Billing cycle: **monthly** or **yearly**
- Toggle **auto-renew**
- Fields: `maxMessages`, `price`, `startDate`, `endDate`, `renewalDate`
- Simulated billing: auto-renew due subscriptions; ~20% random payment failure → `PAYMENT_FAILED`
- Cancel: ends renewal, preserves usage/history (`CANCELLED`)

## Architecture

```
src/
  database/                 PrismaModule
  shared/                   DomainError + exception filter
  modules/
    users/                  domain / application / infrastructure / presentation
    chat/                   domain / application / infrastructure / presentation
    subscriptions/          domain / application / infrastructure / presentation
```

Ports (interfaces) live in `domain/`; Prisma adapters and mocks live in `infrastructure/`; Nest controllers + DTOs in `presentation/`.

## Prerequisites

- Node.js 20+
- Docker (for Postgres) **or** an existing Postgres matching the credentials below

Postgres (already provided locally):

| Setting  | Value            |
|----------|------------------|
| Host     | `localhost`      |
| Port     | `5432`           |
| User     | `postgres`       |
| Password | `postgres`       |
| Database | `ai_subscription`|

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Environment
cp .env.example .env

# 3. Start Postgres (if needed)
docker compose up -d

# 4. Apply schema / generate client
npx prisma generate
npx prisma db push
# or: npm run prisma:migrate

# 5. Optional demo data
npm run prisma:seed

# 6. Run API
npm run start:dev
```

API base URL: `http://localhost:3000/api`

## Plans & pricing

| Tier       | maxMessages | Monthly | Yearly |
|------------|-------------|---------|--------|
| BASIC      | 10          | 10      | 100    |
| PRO        | 100         | 50      | 500    |
| ENTERPRISE | unlimited   | 200     | 2000   |

## API

### Users

```http
POST /api/users
Content-Type: application/json

{ "email": "alice@example.com" }
```

```http
GET /api/users/:id
```

Auth is **userId-based**: pass `userId` in the JSON body or query string (no JWT).

### Chat

```http
POST /api/chat/messages
Content-Type: application/json

{ "userId": "<uuid>", "question": "What is Clean Architecture?" }
```

```http
GET /api/chat/messages?userId=<uuid>
GET /api/chat/usage?userId=<uuid>
```

### Subscriptions

```http
POST /api/subscriptions
Content-Type: application/json

{
  "userId": "<uuid>",
  "tier": "BASIC",
  "billingCycle": "MONTHLY",
  "autoRenew": true
}
```

`tier`: `BASIC` | `PRO` | `ENTERPRISE`  
`billingCycle`: `MONTHLY` | `YEARLY`

```http
GET /api/subscriptions?userId=<uuid>
PATCH /api/subscriptions/:id/auto-renew
{ "autoRenew": false }

POST /api/subscriptions/:id/cancel
POST /api/subscriptions/billing/run
```

### Quota error shape

```json
{
  "statusCode": 402,
  "code": "QUOTA_EXCEEDED",
  "message": "Monthly free quota exhausted and no active subscription with remaining messages",
  "details": {
    "freeMessagesUsed": 3,
    "freeMessagesLimit": 3,
    "activeSubscriptions": 0
  }
}
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create/apply migrations |
| `npm run prisma:seed` | Seed demo user + BASIC bundle |

## Assignment PDF

Place the provided test/assignment PDF in the repository root (e.g. `assignment.pdf`) before final submission if it is not already included.

## Author

Afaq Khan — repository name: `afaq-khan`
