# Test Isolation Plan

## Status
DEFERRED 2026-07-20. 22 tests skipped.

## Problem
server/__tests__/integration.test.ts (14 tests) and
server/__tests__/auth-api.test.ts (8 tests) require
real DB behavior. The global Drizzle mock returns a
query builder object instead of arrays, causing
TypeError: (intermediate value) is not iterable.

Running against Railway production DB is unsafe —
destructive test operations would affect real user
data.

## Solution
Provision an isolated MySQL 8 test database:

1. Add DATABASE_URL_TEST to .env.test.local pointing
   to a separate Railway DB or local MySQL instance
   (never the production Railway DB)

2. Add a vitest globalSetup that:
   - Runs all Drizzle migrations against the test DB
   - Seeds minimal required reference data
   - Wraps each test in a transaction that rolls back

3. Update vitest.config.ts to use the test DB URL
   for integration test files specifically

4. auth-api.test.ts additionally needs --pool=forks
   vitest flag or a mock HTTP adapter — it requires
   network socket permission to open a local listener

## Estimated effort
M — 2-3 days including Railway test DB provisioning,
migration runner, and transaction rollback wrapper.
