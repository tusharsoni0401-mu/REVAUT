# RevAut — Project Context for Claude Code

Review Autopilot: a SaaS dashboard for restaurants to manage, respond to, and analyse Google/TripAdvisor reviews using AI.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 18 + TypeScript + Tailwind + shadcn/ui |
| State | Zustand (`src/stores/`) |
| Database | Supabase (Postgres) |
| AI | Gemini 2.0 Flash via Express server |
| Backend | Express (`server/`) — proxies AI calls, hides API key |
| Routing | React Router v6 |

---

## Project Structure

```
revaut/
├── server/                     # Express API server (run separately)
│   ├── index.js                # POST /api/generate-response, POST /api/evaluate-response, GET /api/health
│   ├── seed.js                 # One-time DB seed from mock data (already run)
│   ├── schema.sql              # Supabase table definitions (already applied)
│   ├── package.json
│   └── .env                    # GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT=3001
│
├── src/
│   ├── App.tsx                 # Routes: /login public, everything else inside AuthGuard + Layout
│   ├── lib/
│   │   └── supabase.ts         # Supabase anon client
│   ├── stores/
│   │   ├── useReviewStore.ts   # Reviews + AI responses — Supabase-backed
│   │   └── useLocationStore.ts # Locations — Supabase-backed
│   ├── hooks/
│   │   ├── useAuth.ts          # useAuth() session hook + signIn/signUp/signOut helpers
│   │   └── useBrandVoice.ts    # Brand voice settings — Supabase-backed
│   ├── components/
│   │   ├── AuthGuard.tsx       # Redirects unauthenticated users to /login
│   │   ├── AppSidebar.tsx      # Shows user email + logout button in footer
│   │   └── Layout.tsx
│   ├── services/
│   │   ├── geminiService.ts    # Calls /api/generate-response & /api/evaluate-response
│   │   └── gbpOAuth.ts         # GBP OAuth scaffold (token exchange is simulated)
│   ├── data/
│   │   └── mockData.ts         # Types only — DB is the source of truth for data
│   └── pages/
│       ├── Login.tsx           # Login + signup (single page, mode toggled)
│       ├── Dashboard.tsx
│       ├── Reviews.tsx
│       ├── ReviewDetail.tsx
│       ├── BrandVoice.tsx
│       ├── Insights.tsx
│       ├── Settings.tsx
│       ├── BackfillQueue.tsx
│       └── GBPCallback.tsx     # OAuth callback handler
│
├── .env                        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (no secrets)
├── vite.config.ts              # Proxy: /api → localhost:3001
└── package.json
```

---

## Supabase Database

**Project URL:** `https://wywtnbbgikiztjretkrd.supabase.co`

| Table | Rows | Notes |
|---|---|---|
| `locations` | 3 | La Bella Italia (Main, Brooklyn, Queens) |
| `reviews` | 35 | Seeded from mockData. 18 pending. |
| `ai_responses` | 31 | Pre-seeded template responses |
| `brand_voice_settings` | 1 | Single `id='default'` row |

**Column naming:** DB uses `snake_case` (e.g. `location_id`, `is_backfill`, `cuisine_type`). Frontend uses `camelCase`. Mapping happens in store files.

---

## Running Locally (2 terminals)

```bash
# Terminal 1 — API server
cd server && npm run dev
# Runs on http://localhost:3001

# Terminal 2 — Frontend
npm run dev
# Runs on http://localhost:8080
# /api/* proxied to :3001 via vite.config.ts
```

---

## Environment Variables

### `server/.env`
```
GEMINI_API_KEY=...          # Gemini 2.0 Flash — server-side only, never exposed to browser
SUPABASE_URL=https://wywtnbbgikiztjretkrd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=... # Full DB access — server only
PORT=3001
```

### `.env` (frontend)
```
VITE_SUPABASE_URL=https://wywtnbbgikiztjretkrd.supabase.co
VITE_SUPABASE_ANON_KEY=...  # Safe to expose — protected by RLS (once auth is added)
```

---

## What's Done / What's Next

### Phase 1 — Backend (DONE)
- [x] **1.1** Express server with `/api/generate-response`
- [x] **1.2** `/api/evaluate-response` endpoint
- [x] **1.3** Gemini API key moved server-side

### Phase 2 — Database (DONE)
- [x] **2.1** Supabase project + schema + seed
- [x] **2.2** `useReviewStore` + `useLocationStore` wired to Supabase
- [x] **2.3** Settings page saves location changes to DB
- [x] **2.4** `useBrandVoice` loads/saves from `brand_voice_settings` table

### Phase 3 — Authentication (DONE)
- [x] **3.1** Supabase Auth — `useAuth` hook, `signIn/signUp/signOut`, Login page (login + signup toggled)
- [x] **3.2** `AuthGuard` component wraps all protected routes; user email + logout in sidebar footer

### Phase 4 — Deployment (IN PROGRESS)
- [x] **4.1** Configure Vite build for production (code splitting, env vars)
- [x] **4.2** Deploy — frontend (Netlify) + backend (Render) config files created
- [ ] **4.3** Environment variable management for production

### Phase 5 — Polish
- [ ] **5.1** Dynamic insight alerts (C8 from PRD) — compute from real review data
- [ ] **5.2** Remaining UI tasks (G1–G10 from PRD): sidebar badge, page titles, URL-synced filters, etc.
- [ ] **5.3** Error boundaries + loading skeletons

---

## Key Architectural Decisions

- **No Next.js** — kept as Vite SPA + separate Express server. Simpler to reason about.
- **Zustand over React Query** — already in codebase, good enough for this data shape.
- **Single `brand_voice_settings` row** — `id='default'`, shared across all users for now. Per-user data can be added post-launch.
- **Gemini not Claude** — using `gemini-2.0-flash` via `GEMINI_API_KEY`. The user has a free-tier Gemini key. Do not switch to Claude API unless asked.
- **Service role key in server only** — frontend only ever sees the anon key.
- **mockData.ts kept** — still used for TypeScript types (`Review`, `AIResponse`, etc.). The actual data arrays are no longer used by the app — DB is the source of truth.

---

## PRD Reference

Original task breakdown is in `RevAut_TaskBreakdown.pdf` (project root, one level up).
Bug fixes B1–B12 are all applied. Gemini tasks G1–G10 are partially done. Claude tasks C1–C8 are mostly done via the Supabase+store architecture.
