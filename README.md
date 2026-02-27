# ZR Hauls Quote Builder

Internal tool for generating haul quotes and Discord-formatted messages. Replaces a Google Sheets workflow with a persistent, cross-device web app featuring AI-powered weight estimation. Completely vibe-coded, except for some manual debugging. AI coding has come very far, and I'm all ears. 

**Live:** [haulmaker.pages.dev](https://haulmaker.pages.dev)

## Stack

| Layer | Tech | Hosting |
|-------|------|---------|
| Frontend | Next.js 15, React 19, Tailwind, shadcn/ui | Cloudflare Pages |
| Backend | Express 4, TypeScript, Prisma ORM | Railway |
| Database | PostgreSQL | Railway |
| AI | Perplexity Sonar Pro (web search) | Perplexity API |

## Features

### Quote Management
- Create, duplicate, and delete quotes
- Search quotes by customer name or order ID
- Per-quote configurable settings (exchange rate, shipping rate, insurance, haul fee)
- Autosave with debounced API calls

### Item Management
- Add items with link, name, yuan price, and type
- Inline editing — click any cell to edit
- Include/exclude toggle per item
- Default weights by item type (tee, hoodie, pants, shoes, accessory, custom)
- Custom weight override per item

### AI Weight Estimation
- Powered by **Perplexity Sonar Pro** with live web search
- Searches the internet for actual product weights and dimensions
- Estimates both **actual weight** and **volumetric weight** (L×W×H / 5000)
- Uses whichever is higher as the final weight
- Overestimates for quote cushion
- Shows confidence level, dimensions, and reasoning per estimate

### Calculations

**Per-item USD:**
```
usd = (yuan / exchangeRate) + fixedFeeUsd
```

**Totals:**
```
totalItemCost = sum of included items USD
totalWeightKg = sum of item weights / 1000
shipping      = totalWeightKg × shippingPerKgUsd
insurance     = totalItemCost × insuranceRate
grandTotal    = totalItemCost + haulFee + shipping + insurance
```

**Defaults:** Exchange rate 6.5, Fixed fee $2, Shipping $18/kg, Insurance 15%, Haul fee $10

### Discord Output
Generates a formatted message ready to paste into Discord:

```
Item Name - $XX.XX
Item Name - $XX.XX

Flat Rate Haul Fee - $10

Total Item Cost + Fees - $XXX.XX

International Shipping - TBD (Estimate: X.Xkg * $18/kg = $XXX.XX)

International Shipping Insurance (15% of item cost, full refund if lost/seized): TBD (Estimate: $XX.XX)

Estimated Grand Total - $XXX.XX

Total Item Cost + Fees are paid upfront, and once everything arrives at the China warehouse, I'll provide an accurate shipping and insurance quote.
```

### Export
- Copy Discord message to clipboard
- Export quote as JSON
- Export quote as CSV

### Auth
- Single password login (no user accounts)
- JWT tokens (24h expiry) stored in localStorage
- Auto-redirect to login on 401

## Default Weights

| Type | Weight |
|------|--------|
| Tee | 250g |
| Hoodie | 850g |
| Pants | 700g |
| Shoes | 1400g |
| Accessory | 300g |
| Custom | 0g (must specify) |

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login with password |

### Protected (requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quotes` | List all quotes |
| POST | `/api/quotes` | Create quote |
| GET | `/api/quotes/:id` | Get quote |
| PUT | `/api/quotes/:id` | Update quote |
| DELETE | `/api/quotes/:id` | Delete quote |
| POST | `/api/quotes/:id/duplicate` | Duplicate quote with items |
| POST | `/api/quotes/:id/items` | Add item to quote |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/estimate-weight` | AI weight estimation |

## Local Development

### Prerequisites
- Node.js 22+
- PostgreSQL database

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your database URL, password, and API keys
npm install
npm run db:push
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev
```

### Environment Variables

**Backend (`.env`):**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | Frontend origin for CORS |
| `PORT` | Server port (default: 4000) |
| `APP_PASSWORD` | Login password |
| `JWT_SECRET` | JWT signing secret |
| `PERPLEXITY_API_KEY` | Perplexity API key for weight estimation |

**Frontend (`.env.local`):**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `http://localhost:4000/api`) |

## Deployment

### Backend → Railway
1. Connect GitHub repo to Railway
2. Set root directory to `backend/`
3. Build: `npm run build` (runs `prisma generate && tsc`)
4. Start: `npm run start`
5. Add all env vars (use internal Postgres URL for `DATABASE_URL`)

### Frontend → Cloudflare Pages
1. Connect GitHub repo to Cloudflare Pages
2. Set root directory to `frontend/`
3. Build: `npm run build`
4. Output directory: `out`
5. Set `NEXT_PUBLIC_API_URL` to Railway backend URL + `/api`

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server, CORS, route mounting
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login endpoint
│   │   │   ├── quotes.ts         # Quote CRUD + duplicate
│   │   │   ├── items.ts          # Item CRUD
│   │   │   └── estimate.ts       # Perplexity AI weight estimation
│   │   ├── middleware/auth.ts     # JWT verification
│   │   └── lib/prisma.ts         # Prisma client singleton
│   └── prisma/schema.prisma      # Database schema
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/page.tsx     # Login page
│   │   │   ├── quotes/page.tsx    # Quote list
│   │   │   └── editor/page.tsx    # Quote editor
│   │   ├── components/
│   │   │   ├── AddItemForm.tsx    # Add item form
│   │   │   ├── ItemsTable.tsx     # Editable items table + AI estimate
│   │   │   ├── QuoteEditor.tsx    # Main editor layout
│   │   │   ├── SettingsCard.tsx   # Quote settings (autosave)
│   │   │   ├── SummaryCard.tsx    # Calculation totals
│   │   │   ├── OutputCard.tsx     # Discord output + export
│   │   │   ├── AuthGuard.tsx      # Auth wrapper
│   │   │   └── Header.tsx         # Nav header + logout
│   │   └── lib/
│   │       ├── api.ts             # API client with auth
│   │       ├── auth.ts            # Token helpers
│   │       ├── calculations.ts    # Quote math
│   │       ├── discord.ts         # Discord message formatter
│   │       ├── export.ts          # JSON/CSV export
│   │       └── types.ts           # TypeScript interfaces
│   └── public/_redirects          # Cloudflare SPA fallback
```
