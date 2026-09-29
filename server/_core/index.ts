import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./authRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import apiRoutes from "../routes";
import { serveStatic, setupVite } from "./vite";
import { logEnvStatus } from "./env";
import { startComplianceMonitorCron } from "../cron/complianceMonitorCron";
import { handleStripeWebhook, handleAPSWebhook } from "../routers";
import { exchangeCode } from "../services/apsAuthService";
import { getDb } from "../db";
import { apsConnections } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Validate environment variables at startup
logEnvStatus();

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust Railway's reverse proxy for correct protocol detection
  const server = createServer(app);
  // Stripe webhook needs raw body — must be registered BEFORE express.json()
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

  // APS webhook — raw body required
  app.post("/api/webhooks/aps", express.raw({ type: "application/json" }), handleAPSWebhook);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // General API rate limit — 200 req / 15 min per IP
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) => req.path.startsWith("/api/webhooks"),
  });

  // Strict limit for unauthenticated payment / report creation endpoints
  const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many payment requests. Please try again later." },
  });

  app.use("/api", generalLimiter);
  app.use("/api/trpc/home.createReport", paymentLimiter);
  app.use("/api/trpc/subscriptions.createContractorSession", paymentLimiter);
  // Clerk auth session endpoint
  registerAuthRoutes(app);

  // APS (Autodesk) OAuth callback — exchanges code, stores tokens, redirects to integrations page
  app.get("/api/autodesk/callback", async (req, res) => {
    const code  = typeof req.query.code  === "string" ? req.query.code  : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;

    if (!code || !state) {
      return res.redirect("/integrations?error=missing_params");
    }

    let userId: number | null = null;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      userId = typeof decoded.userId === "number" ? decoded.userId : null;
    } catch {
      return res.redirect("/integrations?error=invalid_state");
    }

    if (!userId) {
      return res.redirect("/integrations?error=invalid_state");
    }

    try {
      const tokens   = await exchangeCode(code);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      const db       = await getDb();

      if (db) {
        await db
          .insert(apsConnections)
          .values({
            userId,
            accessToken:    tokens.access_token,
            refreshToken:   tokens.refresh_token,
            tokenExpiresAt: expiresAt,
          })
          .onDuplicateKeyUpdate({
            set: {
              accessToken:    tokens.access_token,
              refreshToken:   tokens.refresh_token,
              tokenExpiresAt: expiresAt,
            },
          });
      }

      return res.redirect("/integrations?connected=true");
    } catch (err) {
      console.error("[APS Callback] token exchange failed:", err);
      return res.redirect("/integrations?error=token_exchange_failed");
    }
  });
  // REST API routes
  app.use(apiRoutes);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startComplianceMonitorCron();
  });
}

startServer().catch(console.error);
