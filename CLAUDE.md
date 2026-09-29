# CodeComply — Claude Code Standing Instructions

## Repository
jadconsc-bot/building_code_occupancy_app
Production: complycode.ca (Railway, MySQL 8)

## Branch Rules
- Production work starts from `main`: `git checkout main && git pull origin main`
- After staging verification, production changes push with `git push origin HEAD:main`
- Staging work pushes with `git push origin HEAD:staging`
- Never push unverified work directly to `main` or to arbitrary feature branches

### Staging environment
- The `staging` branch deploys to a separate Railway environment with its own database and the existing Clerk Development instance, fully isolated from production.
- New work lands on `staging` first. Push to `staging`, verify the change there (including sign-in and any affected core flows), then merge to `main` to reach production.
- Never push a schema or auth change straight to `main` without testing it on staging first. This practice gap caused the September 28, 2026 production outage (an unapplied migration broke authenticated requests) and the Clerk-key identity mismatch that followed it.
- Staging's database starts empty and is not kept in sync with production data; it verifies code behavior rather than testing against real records.
- Staging uses Stripe test-mode keys; no real charges occur there.
- When a change needs raw SQL (see the users-table exception below), apply it to staging first, confirm it, then apply the same SQL to production after `main` is updated.

## Locked Files — NEVER touch without Jose's explicit approval
- client/index.html
- client/src/main.tsx
- client/src/_core/hooks/useAuth.ts
- server/_core/env.ts
- server/complianceEngine.ts
- server/compliancePathwayGenerator.ts
- server/complianceRouter.ts
- client/src/contexts/AuthHydrationContext.tsx
- server/_core/middleware.ts

## Locked-Adjacent — new consumers need Jose's explicit sign-off (not a full lock, but touching
## these or adding a new caller of them should be flagged in the spec before implementing)
- server/engine/rules/fire.ts
- server/engine/rules/egress.ts
- server/routers/complianceRouter.ts  (thin wrapper — kept separate from the locked engine above
  since it's lower-stakes, but still worth a heads-up before editing)

## Standing Disciplines
- RECON before implementation — always read current state first
- Never implement before reading the files being changed
- "Matches another file" ≠ verified
- "NBC 2023" = hallucination — federal editions are NBC 2020 and NBC 2025
- All NBC compliance values verified against primary PDF before code changes
- drizzle-kit push: review EVERY proposed change — never accept blindly
- NEVER use drizzle-kit push on tables with tinyint(1) columns — use raw ALTER TABLE
  (affected tables: detectedRooms, drawingPages, projects, trainingExamples)
- DB queries: use Railway Data tab for production — never Manus TiDB sandbox
- Claude Code raw output: instruct "paste raw output only, no interpretation"

## Schema Drift
- See drizzle/SCHEMA_DRIFT_NOTES.md for full details
- Permanent tinyint(1) drift is accepted — do not attempt to fix via drizzle-kit

## Commit Process
Every commit must follow:
1. pnpm tsc --noEmit — confirm clean
2. pnpm vitest run — confirm no new failures
3. git add only the files changed
4. git push origin HEAD:main
5. git fetch origin && git log --oneline origin/main -3

## DrawingAnalysis.tsx UI Audit Baseline
- 67 Buttons, 93 onClick handlers
- Always grep for current count before and after any edits

## Tech Stack
React 18, TypeScript, Express, tRPC, Drizzle ORM, MySQL 8
Clerk auth, Stripe, Anthropic Claude, Railway hosting
Node: pnpm for package management
Roboflow workflow integrations live in `server/services/codeComplyWorkflowService.ts`; use Bearer auth from `ENV.roboflowApiKey` and keep `server/scripts/smokeCodeComplyWorkflow.ts` as the manual smoke check.

## NBC Compliance Discipline
- Primary source: NBC 2020 PDF (1,530 pages, in project)
- NBC 2025 confirmed: all Part 3 values identical to NBC 2020
- Alberta overrides: NBC(AE) 2023 — only 3 confirmed overrides
  (ceiling height 1.95m, beam clearance 1.85m, door height 1890mm)
- shared/occupantLoadFactors.ts is the canonical occupant load source
- Never duplicate occupant load values in other files
