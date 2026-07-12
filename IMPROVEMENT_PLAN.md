# LifePath-Adventure — Backend Improvement Plan

> Coordination document for the **daily automated improvement** workflow.
> A scheduled task reads this file each day, implements the next un-started item,
> verifies it with tests/build, and opens **one** pull request.

## 1. Project intent

**LifePath-Adventure** is the marketing/landing site for *Lifepath Adventure*, a
pixelated sci-fi RPG. The live app is the Vite + React SPA in
[`lifepath-adventure/`](./lifepath-adventure); the repo root also holds some
earlier static/scaffold experiments.

The site's core conversion goal is the **"Sign Up for Updates" / newsletter CTA**
— but there is currently **no backend**, so a real signup cannot be captured.
That is the gap this plan fills.

## 2. Backend vision

Build a small, well-tested Node.js backend (in [`server/`](./server)) that powers
the newsletter signup and grows into a solid API foundation for the game site:

- **Runtime:** Node.js (>=20), Express.
- **Tests:** Vitest + Supertest, runnable offline with `npm test` (no network).
- **Storage:** starts in-memory → JSON file → SQLite, without breaking the API.
- **Quality:** validation, error handling, security headers, logging, config,
  graceful shutdown, CI.

## 3. Ground rules for every daily PR

1. **Positive-only.** Never remove working behavior. Each PR is a *net
   improvement* and must leave `npm test` (and any build) green.
2. **One PR per run**, scoped to a single backlog item.
3. **Prove it.** Add/extend tests and actually run them before opening the PR.
   Run the server and exercise the endpoint when relevant.
4. **Small is fine.** PR size does not matter; correctness and positivity do.
5. **Update this file** in the same PR: move the item to `Done` with the PR link.
6. **Avoid duplicates.** Before starting, check open + recently-merged PRs and
   skip any item already in flight; take the next un-started one.
7. **Never run dry.** If every item below is `Done`, append 1–3 new positive
   backend improvements (test coverage, perf, refactors, dep hygiene, docs) and
   implement the first.

## 4. Backlog (ordered — take the topmost un-started item)

| # | Item | What "done" looks like | Status |
|---|------|------------------------|--------|
| B01 | Scaffold backend | `server/` with Express app, `GET /api/health` → `{status:"ok"}`, `npm start`/`npm test` scripts, Vitest+Supertest, one passing health test | ⬜ Todo |
| B02 | Subscribe endpoint | `POST /api/subscribe` validates email → `201` on valid, `400` on invalid; in-memory store; tests cover both paths | ⬜ Todo |
| B03 | Persist to JSON file | Subscribers survive restart via a JSON data file; tests verify persistence; data file git-ignored | ⬜ Todo |
| B04 | Duplicate handling | Re-subscribing the same email is idempotent (`200`, no dup); tests | ⬜ Todo |
| B05 | Input hardening | Normalize (trim + lowercase) email, enforce max length, reject empty/oversized; tests | ⬜ Todo |
| B06 | Rate limiting | Per-IP limit on `/api/subscribe` returns `429` when exceeded; tests | ⬜ Todo |
| B07 | Error middleware | Central error handler + JSON 404 + consistent `{error}` shape; tests | ⬜ Todo |
| B08 | Config via env | `PORT`, `DATA_FILE` from env with validated defaults; tests | ⬜ Todo |
| B09 | Structured logging | Request logging (method, path, status, duration); quiet in tests; smoke test | ⬜ Todo |
| B10 | Subscriber count | `GET /api/subscribers/count` returns aggregate only (no PII); tests | ⬜ Todo |
| B11 | Security headers + CORS | `helmet` + configurable CORS allowlist; tests assert headers | ⬜ Todo |
| B12 | Graceful shutdown | Handle SIGTERM/SIGINT, close server cleanly; readiness reflected in health | ⬜ Todo |
| B13 | SQLite storage | Swap JSON store for `better-sqlite3` behind the same interface; tests still pass | ⬜ Todo |
| B14 | Unsubscribe | `POST /api/unsubscribe` with token/email removes subscriber; tests | ⬜ Todo |
| B15 | OpenAPI docs | Serve an OpenAPI spec + `/api/docs`; spec validated in a test | ⬜ Todo |
| B16 | CI workflow | GitHub Actions runs backend `npm ci && npm test` on PRs touching `server/` | ⬜ Todo |
| B17 | Request IDs | Attach/propagate a request id, include it in logs and error responses; tests | ⬜ Todo |
| B18 | Metrics | `GET /api/metrics` exposes basic counters (requests, subscribes); tests | ⬜ Todo |
| B19 | Frontend contract | Document + test the request/response contract the SPA will use for signup | ⬜ Todo |
| B20 | Dockerfile | Backend `Dockerfile` + `.dockerignore` + `HEALTHCHECK`; build documented | ⬜ Todo |

## 5. Done

_(Completed items move here with their PR link and date.)_
