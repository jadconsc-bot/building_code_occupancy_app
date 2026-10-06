import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { MySqlDialect } from "drizzle-orm/mysql-core";

const mocks = vi.hoisted(() => ({
  app: null as Express | null,
  getDb: vi.fn(),
  execute: vi.fn(),
}));

// Import the real entrypoint and route registration without starting a listener,
// cron jobs, auth integrations, or a real database connection.
vi.mock("dotenv/config", () => ({}));
vi.mock("http", () => ({
  createServer: vi.fn((app: Express) => {
    mocks.app = app;
    return { listen: vi.fn() };
  }),
}));
vi.mock("net", () => ({
  default: {
    createServer: () => ({
      listen: (_port: number, callback: () => void) => callback(),
      close: (callback: () => void) => callback(),
      on: vi.fn(),
    }),
  },
}));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../_core/env", () => ({ logEnvStatus: vi.fn() }));
vi.mock("../routers", () => ({
  appRouter: {}, handleStripeWebhook: vi.fn(), handleAPSWebhook: vi.fn(),
}));
vi.mock("../_core/context", () => ({ createContext: vi.fn() }));
vi.mock("@trpc/server/adapters/express", () => ({ createExpressMiddleware: () => vi.fn() }));
vi.mock("../routes", () => ({ default: vi.fn() }));
vi.mock("../_core/vite", () => ({ setupVite: vi.fn(), serveStatic: vi.fn() }));
vi.mock("../cron/complianceMonitorCron", () => ({ startComplianceMonitorCron: vi.fn() }));
vi.mock("../services/apsAuthService", () => ({ exchangeCode: vi.fn() }));
vi.mock("../_core/authRoutes", () => ({
  registerAuthRoutes: (app: Express) => {
    // A successful health response proves registration precedes auth middleware.
    app.use((_req, res) => { res.status(401).json({ error: "auth reached" }); });
  },
}));

describe("GET /api/health", () => {
  beforeAll(async () => {
    await import("../_core/index");
  });

  beforeEach(() => {
    mocks.getDb.mockReset().mockResolvedValue({ execute: mocks.execute });
    mocks.execute.mockReset().mockResolvedValue([]);
    vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", "abcdef1234567890");
  });

  afterEach(() => { vi.unstubAllEnvs(); });

  async function health() {
    const response = await request(mocks.app!).get("/api/health");
    expect(Object.keys(response.body).sort()).toEqual(["commit", "db", "status"]);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["set-cookie"]).toBeUndefined();
    return response;
  }

  it("returns 200 with only the approved fields after a read-only DB ping", async () => {
    const response = await health();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", db: "ok", commit: "abcdef1" });
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(new MySqlDialect().sqlToQuery(mocks.execute.mock.calls[0][0]).sql).toBe("SELECT 1");
  });

  it("returns 503 without leaking DB error details when the ping throws", async () => {
    mocks.execute.mockRejectedValue(new Error("private connection details"));
    const response = await health();
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "degraded", db: "error", commit: "abcdef1" });
  });

  it("returns a null commit when Railway's commit variable is absent", async () => {
    vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", undefined);
    const response = await health();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", db: "ok", commit: null });
  });

  it("returns 503 when getDb cannot provide a connection", async () => {
    mocks.getDb.mockResolvedValue(null);
    const response = await health();
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "degraded", db: "error", commit: "abcdef1" });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("returns 503 after about two seconds when the DB ping stalls", async () => {
    mocks.execute.mockImplementation(() => new Promise(() => {}));
    const started = Date.now();
    const response = await health();
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "degraded", db: "error", commit: "abcdef1" });
    expect(Date.now() - started).toBeGreaterThanOrEqual(1900);
  });
});
