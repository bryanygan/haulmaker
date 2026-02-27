# ZR Hauls Quote Builder — Roadmap (Cloudflare Pages + Railway Backend)

## 🧠 Architecture Overview (FINAL STACK)

**Frontend**
- Cloudflare Pages
- Next.js (App Router) + TypeScript
- TailwindCSS + shadcn/ui

**Backend**
- Railway (Node.js API)
- Express (or Fastify)

**Database**
- Railway Postgres
- Prisma ORM

**Auth (v1 simple, v2 upgradeable)**
- v1: single-password login (env-based)
- v2: JWT + httpOnly cookies

---

# 0) Goal

Build a full internal tool to replace your Google Sheet that:
- Generates haul quotes instantly
- Stores quotes persistently
- Works across devices
- Outputs **Discord-ready formatted messages**
- Scales into a full business system later (ZR Hauls backend)

---

# 1) Core Features

## 1.1 Quote Creation Flow
- Create quote (customer name, optional order ID)
- Add items:
  - Link
  - Name
  - Yuan price
  - Type (auto weight)
  - Optional custom weight
  - Include toggle
- Live calculations:
  - USD per item
  - Total item cost
  - Total weight (kg)
  - Shipping estimate
  - Insurance estimate
- Generate Discord message
- Copy/export

---

## 1.2 Calculations

### Per-item USD
```

usd = round((yuan / exchangeRate) + fixedFeeUsd, 2)

```

Defaults:
- exchangeRate = 6.5
- fixedFeeUsd = 2

---

### Totals
```

totalItemCost = sum(included items usd)

totalWeightKg = sum(weightGrams or defaultWeight[type]) / 1000

shipping = totalWeightKg * shippingPerKgUsd

insurance = totalItemCost * insuranceRate

```

Defaults:
- shippingPerKgUsd = 18
- insuranceRate = 0.15
- haulFee = 10

---

## 1.3 Discord Output Format

STRICT formatting:

```

Item Name - $XX.XX
Item Name - $XX.XX

Flat Rate Haul Fee - $10

Total Item Cost + Fees - $XXX.XX

International Shipping - TBD (Estimate: X.Xkg * $18/kg = $XXX.XX)

International Shipping Insurance (15% of item cost, full refund if lost/seized): TBD (Estimate: $XX.XX)

Total Item Cost + Fees are paid upfront, and once everything arrives at the China warehouse, I'll provide an accurate shipping and insurance quote.

````

---

# 2) Data Model

## Quote
```ts
Quote {
  id: string (uuid)
  customerName: string
  customerHandle?: string
  orderId?: string
  createdAt: Date
  updatedAt: Date

  exchangeRate: number
  fixedFeeUsd: number
  shippingPerKgUsd: number
  insuranceRate: number
  haulFeeUsd: number
}
````

## Item

```ts
Item {
  id: string
  quoteId: string

  link: string
  name: string
  yuan: number

  type: "tee" | "hoodie" | "pants" | "shoes" | "accessory" | "custom"
  weightGrams?: number

  include: boolean
}
```

---

## Default Weights

| Type      | Weight |
| --------- | ------ |
| tee       | 250g   |
| hoodie    | 850g   |
| pants     | 700g   |
| shoes     | 1400g  |
| accessory | 300g   |
| custom    | 0      |

---

# 3) Frontend (Cloudflare Pages)

## Pages

### `/quotes`

* List all quotes
* Search by customer/order ID
* Create new quote
* Duplicate / delete

---

### `/quotes/[id]`

Two-column layout:

#### Left

* Add item form
* Items table (editable)

#### Right

* Settings
* Summary
* Output

---

## Components

* AddItemForm
* ItemsTable
* SettingsCard
* SummaryCard
* OutputCard

---

## Key UX Features

* Inline editing
* Autosave (API debounce)
* Copy button (clipboard API)
* Toast notifications
* Warning if missing weights

---

# 4) Backend (Railway API)

## Base URL

```
/api
```

---

## Endpoints

### Quotes

```
GET    /quotes
POST   /quotes
GET    /quotes/:id
PUT    /quotes/:id
DELETE /quotes/:id
```

### Items

```
POST   /quotes/:id/items
PUT    /items/:id
DELETE /items/:id
```

---

## Example POST /quotes

```json
{
  "customerName": "Bryan",
  "orderId": "ZR-001"
}
```

---

# 5) Database (Postgres + Prisma)

## Prisma Schema

```prisma
model Quote {
  id                String   @id @default(uuid())
  customerName      String
  customerHandle    String?
  orderId           String?

  exchangeRate      Float    @default(6.5)
  fixedFeeUsd       Float    @default(2)
  shippingPerKgUsd  Float    @default(18)
  insuranceRate     Float    @default(0.15)
  haulFeeUsd        Float    @default(10)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  items             Item[]
}

model Item {
  id          String  @id @default(uuid())
  quoteId     String
  quote       Quote   @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  link        String
  name        String
  yuan        Float

  type        String
  weightGrams Float?
  include     Boolean @default(true)
}
```

---

# 6) Implementation Phases

## Phase 1 — Frontend + Mock Data

* Build UI
* Local state only
* Implement calculations + output

---

## Phase 2 — Backend API (Railway)

* Setup Express server
* Connect Prisma to Postgres
* Implement CRUD endpoints

---

## Phase 3 — Connect Frontend → API

* Replace local state with API calls
* Add autosave
* Add loading + error states

---

## Phase 4 — Export + Polish

* JSON export
* CSV export
* Copy UX improvements

---

## Phase 5 — Auth (Optional but recommended)

* Simple password login (env-based)
* Store session in cookie

---

# 7) Deployment

## Frontend (Cloudflare Pages)

* Build command: `npm run build`
* Output: `.next`
* Use Next.js adapter for Cloudflare

---

## Backend (Railway)

* Deploy Node server
* Add environment variables:

  * DATABASE_URL
  * APP_PASSWORD (optional)

---

# 8) Acceptance Criteria

* Can create 20-item quote in <2 minutes
* Output matches Discord format EXACTLY
* Copy button works perfectly
* Data persists across devices
* Calculations always correct

---