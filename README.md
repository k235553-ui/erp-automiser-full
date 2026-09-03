# ERP Automiser — MVP Scaffold

A metadata-driven ERP builder: users describe their business, get AI-recommended
modules, customize fields, and get generic CRUD screens auto-generated from that
metadata — no per-user database schema, no AI-generated code. Includes a
Silver/Gold/Premium package-tier system matching the FYP proposal.

## Quick start

**1. Backend**
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
Runs on `http://localhost:4000`. Uses SQLite locally (file created automatically,
no setup needed). Health check: `curl http://localhost:4000/api/health`

**2. Frontend** (separate terminal)
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`, proxies `/api` calls to the backend.

**3. Open** `http://localhost:5173`, register an account, create a business, and
try the "Get recommendations" flow.

## Design

Grounded in the actual product — a ledger/register for real shopkeepers, not a
generic SaaS dashboard:
- Ink-dark sidebar framing light ledger-paper pages
- Spectral (serif) for headings, Inter for UI chrome, **IBM Plex Mono for every
  number** (prices, counts, usage stats) — ledgers set figures in a fixed-width
  face so columns align, same idea here
- Flat rectangles, hairline borders, small corner radius, no drop shadows
- Tier identity colors (Silver/Gold/Premium) kept separate from the single
  accent color so both stay meaningful

## Enabling live AI recommendations

Without an API key, `/api/ai/recommend` uses offline fallback templates so the
app is fully demoable without any account setup.

To use live Claude API:
1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add it to `server/.env`: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the server — it logs which mode it's using on startup.

## Moving from SQLite to Postgres/Supabase

The schema and models don't change — only the driver. See the comment at the top of
`server/src/db/connection.js` for the swap steps.

## What's implemented (MVP scope + tier system)

- Auth (register/login, JWT)
- Business setup, AI-assisted module/field recommendation (review step before saving)
- Manual ERP Builder: create modules, add/remove fields
- Metadata-driven CRUD: `DynamicForm`/`DynamicTable` render forms/tables for *any*
  module purely from its field metadata
- Dashboard with module list + record counts
- Silver / Gold / Premium package tiers:
  - Module count and fields-per-module limits, enforced server-side (`server/src/services/tiers.js`)
  - Employee/Team management with three access roles, tier-gated
  - Billing & Plan page with live (demo) upgrade buttons

## Package tiers — what's real vs. placeholder

| Feature | Status |
|---|---|
| Module limit, fields-per-module limit | **Enforced** (HTTP 402 when hit) |
| Employee Management (3 roles, member limit) | **Enforced** |
| Upgrade/downgrade | **Working**, demo-only — no real payment processor |
| Financial Reports, Automation, Advanced Analytics, Custom Workflows, Advanced Reports | **Not built** — labeled as future roadmap phases on the Billing page, not faked |

## What's not implemented yet

- Real payment integration
- Relations between modules (e.g. Sales → Customer)
- Reports/CSV export, analytics, automation, custom workflows
- Deployment configs (Vercel/Render/Supabase)

## Project structure

```
server/src/
  db/connection.js       # SQLite setup, swap for Postgres later
  models/index.js        # Users, Businesses, Modules, Fields, Records, BusinessMembers
  validators/schemas.js  # Zod schemas incl. buildRecordSchema() — dynamic validation
  services/aiService.js  # Claude API call + fallback templates
  services/tiers.js      # Silver/Gold/Premium tier definitions — single source of truth
  routes/                # auth, businesses, modules (+fields), records, ai, billing
client/src/
  api/client.js          # Fetch wrapper
  hooks/useAuth.jsx
  components/
    AppShell.jsx           # Sidebar layout
    DynamicForm.jsx         # Renders a form from ANY module's field metadata
    DynamicTable.jsx        # Renders a records table from ANY module's field metadata
    TierBadge.jsx
  pages/                  # Auth, Businesses, Setup, Dashboard, Module, Team, Billing
```
