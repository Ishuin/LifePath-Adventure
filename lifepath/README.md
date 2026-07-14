# LifePath

"Life as a game" planner. Describe your current state, your past, and a goal;
LifePath generates a personalized path — steps, skills, levels, certifications,
courses, budget, and connections — and tracks your progress.

Stack: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**,
**Supabase** (Postgres + RLS + Auth), a provider-agnostic **LLM** layer (Claude
default), deployed on **Vercel**. See `../IMPROVEMENT_PLAN.md` and the plan file
for the full roadmap.

## Status: M0–M2 (auth + schema + LLM path generation)

Implemented:
- Themed public landing page (`/`) with the animated constellation background.
- Supabase auth: magic link + Google (`/login`, `/auth/callback`, `/auth/confirm`).
- Session refresh + protected-route gating via `src/proxy.ts` (Next 16 renamed
  `middleware` → `proxy`).
- Database schema, RLS, and signup trigger (`supabase/migrations/0001–0003`),
  validated against real Postgres via PGlite (`npm run db:validate`).
- Intake wizard (`/onboarding`) + goal dashboard (`/dashboard`).
- **LLM path generation** (`src/lib/llm/*`): a provider-agnostic engine
  (`LLMProvider` + `getProvider()`), Claude default via structured outputs and
  an OpenAI alternate, a single Zod contract (`schema.ts`), DAG/reference
  validators with repair-retry (`generatePlan.ts`), a `POST /api/plans/generate`
  route + server action, and a transactional persistence RPC
  (`0004_persist_plan.sql`) that remaps the model's step keys to row UUIDs and
  commits the whole plan graph atomically (one active plan per goal).
- Provider-agnostic env schema (`src/lib/env.ts`, `src/lib/env.server.ts`).

Not yet built (later milestones): path graph + skill/level charts + panels
(M3), progress/XP + regenerate UI (M4), production deploy/hardening (M5).

### Testing the path engine

- `npm test` runs the Vitest suite (schema, validators, and the generate
  orchestration/repair-retry against a deterministic mock provider — no network).
- `npm run db:validate` applies all migrations to an in-process Postgres and
  exercises `persist_generated_plan` end-to-end (key→UUID remapping, RLS
  isolation, one-active-plan supersede).
- Real Claude generation needs `ANTHROPIC_API_KEY` set locally.

## Local development

1. Copy env and fill it in:
   ```bash
   cp .env.example .env.local
   ```
   You need a Supabase project (URL + anon key + service-role key) and, for the
   path engine later, an Anthropic API key.
2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Auth setup (Supabase)

- Create a Supabase project; put its URL + anon key in `.env.local`.
- Enable the **Email (magic link)** provider and the **Google** provider
  (add Google client id/secret in the Supabase dashboard).
- Add your site + Vercel preview/production URLs to Supabase's redirect
  allowlist, and set `NEXT_PUBLIC_SITE_URL` accordingly.

## Deploy (Vercel)

- Import this repo into Vercel with **Root Directory = `lifepath`**.
- Add all variables from `.env.example` in Vercel project settings (mark
  server-only ones as not exposed to the browser).
- The existing GitHub Pages landing site stays live until you cut over.
