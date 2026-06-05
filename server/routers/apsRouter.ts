import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db.js";
import { apsConnections, bcProjectLinks } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import {
  getAuthorizationUrl,
  exchangeCode,
  refreshAccessToken,
} from "../services/apsAuthService.js";
import { getBCProjects } from "../services/buildingConnectedService.js";

export const apsRouter = router({

  // Get OAuth URL to redirect user to Autodesk login
  getAuthUrl: protectedProcedure
    .query(({ ctx }) => {
      const state = Buffer.from(
        JSON.stringify({ userId: ctx.user.id, ts: Date.now() }),
      ).toString("base64");
      return { url: getAuthorizationUrl(state) };
    }),

  // Exchange OAuth code for tokens (called client-side after redirect)
  handleCallback: protectedProcedure
    .input(z.object({ code: z.string(), state: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const tokens = await exchangeCode(input.code);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await db
        .insert(apsConnections)
        .values({
          userId:         ctx.user.id,
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

      return { success: true };
    }),

  // Get connection status for the current user
  getConnection: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { connected: false as const };

      const [conn] = await db
        .select()
        .from(apsConnections)
        .where(eq(apsConnections.userId, ctx.user.id))
        .limit(1);

      return conn
        ? {
            connected:      true as const,
            companyName:    conn.companyName,
            tokenExpiresAt: conn.tokenExpiresAt,
          }
        : { connected: false as const };
    }),

  // List BuildingConnected projects for connected user
  getBCProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [conn] = await db
        .select()
        .from(apsConnections)
        .where(eq(apsConnections.userId, ctx.user.id))
        .limit(1);

      if (!conn?.accessToken) {
        throw new TRPCError({
          code:    "UNAUTHORIZED",
          message: "Connect your Autodesk account first",
        });
      }

      // Refresh token if expired
      let token = conn.accessToken;
      if (conn.tokenExpiresAt && new Date() > conn.tokenExpiresAt) {
        if (!conn.refreshToken) {
          throw new TRPCError({
            code:    "UNAUTHORIZED",
            message: "Session expired — please reconnect",
          });
        }
        const refreshed = await refreshAccessToken(conn.refreshToken);
        token = refreshed.access_token;
        await db
          .update(apsConnections)
          .set({
            accessToken:    refreshed.access_token,
            refreshToken:   refreshed.refresh_token,
            tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
          })
          .where(eq(apsConnections.userId, ctx.user.id));
      }

      return getBCProjects(token);
    }),

  // Link a BC project (or toggle auto-check)
  linkProject: protectedProcedure
    .input(
      z.object({
        bcProjectId:   z.string(),
        bcProjectName: z.string(),
        apsProjectId:  z.string().optional(),
        autoCheck:     z.boolean().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .insert(bcProjectLinks)
        .values({
          userId:           ctx.user.id,
          bcProjectId:      input.bcProjectId,
          bcProjectName:    input.bcProjectName,
          apsProjectId:     input.apsProjectId,
          autoCheckEnabled: input.autoCheck ? 1 : 0,
        })
        .onDuplicateKeyUpdate({
          set: {
            autoCheckEnabled: input.autoCheck ? 1 : 0,
            bcProjectName:    input.bcProjectName,
          },
        });

      return { success: true };
    }),

  // Get all linked projects for the current user
  getLinkedProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(bcProjectLinks)
        .where(eq(bcProjectLinks.userId, ctx.user.id));
    }),

  // Disconnect APS account
  disconnect: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(apsConnections)
        .where(eq(apsConnections.userId, ctx.user.id));
      return { success: true };
    }),
});

// Webhook handler — registered as raw Express route (not tRPC — needs raw body)
export async function handleAPSWebhook(req: any, res: any) {
  const event = req.body;
  console.log("[APS Webhook]", event?.type, event?.resourceId);
  // Phase 2: trigger compliance check when opportunity.created fires with drawings attached
  res.json({ received: true });
}
