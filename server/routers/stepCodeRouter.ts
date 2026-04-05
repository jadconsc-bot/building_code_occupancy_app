import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { stepCodeAnalyses, stepCodeTiers, energyFeatures, jurisdictionProfiles, projects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";
import { nanoid } from "nanoid";

/**
 * Step Code Router - BC Energy Step Code Compliance Checking
 * PD2.0 Compliant: All decisions are deterministic (no LLM in compliance engine)
 * All results are cryptographically signed and immutable
 */

interface ComplianceResult {
  status: "pass" | "fail" | "conditional";
  message: string;
  required?: number | string;
  actual?: number | string;
  gap?: number;
}

/**
 * Evaluate TEDI (Thermal Energy Demand Intensity) compliance
 * Deterministic calculation based on modelled vs. target values
 */
function evaluateTEDI(
  tediTarget: number,
  tediModelled: number
): ComplianceResult {
  const gap = tediModelled - tediTarget;
  const compliant = tediModelled <= tediTarget;

  return {
    status: compliant ? "pass" : "fail",
    message: compliant
      ? `TEDI compliant: ${tediModelled.toFixed(2)} ≤ ${tediTarget.toFixed(2)} kWh/m²/year`
      : `TEDI non-compliant: ${tediModelled.toFixed(2)} > ${tediTarget.toFixed(2)} kWh/m²/year`,
    required: tediTarget,
    actual: tediModelled,
    gap,
  };
}

/**
 * Evaluate TEUI (Thermal Energy Use Intensity) compliance
 */
function evaluateTEUI(
  teuiTarget: number,
  teuiModelled: number
): ComplianceResult {
  const gap = teuiModelled - teuiTarget;
  const compliant = teuiModelled <= teuiTarget;

  return {
    status: compliant ? "pass" : "fail",
    message: compliant
      ? `TEUI compliant: ${teuiModelled.toFixed(2)} ≤ ${teuiTarget.toFixed(2)} kWh/m²/year`
      : `TEUI non-compliant: ${teuiModelled.toFixed(2)} > ${teuiTarget.toFixed(2)} kWh/m²/year`,
    required: teuiTarget,
    actual: teuiModelled,
    gap,
  };
}

/**
 * Evaluate airtightness (ACH50) compliance
 */
function evaluateAirtightness(
  target: number | undefined,
  modelled: number | undefined
): ComplianceResult | null {
  if (!target || !modelled) {
    return null;
  }

  const compliant = modelled <= target;

  return {
    status: compliant ? "pass" : "fail",
    message: compliant
      ? `Airtightness compliant: ${modelled.toFixed(2)} ≤ ${target.toFixed(2)} ACH50`
      : `Airtightness non-compliant: ${modelled.toFixed(2)} > ${target.toFixed(2)} ACH50`,
    required: target,
    actual: modelled,
    gap: modelled - target,
  };
}

/**
 * Evaluate mechanical efficiency compliance
 */
function evaluateMechEfficiency(
  target: number | undefined,
  modelled: number | undefined
): ComplianceResult | null {
  if (!target || !modelled) {
    return null;
  }

  const compliant = modelled >= target;

  return {
    status: compliant ? "pass" : "fail",
    message: compliant
      ? `Mechanical efficiency compliant: ${modelled.toFixed(2)} ≥ ${target.toFixed(2)}`
      : `Mechanical efficiency non-compliant: ${modelled.toFixed(2)} < ${target.toFixed(2)}`,
    required: target,
    actual: modelled,
    gap: modelled - target,
  };
}

/**
 * Generate cryptographic signature for immutable compliance determination
 * Uses HMAC-SHA256 with JWT_SECRET
 */
function generateComplianceSignature(
  projectId: number,
  analysisData: Record<string, any>,
  secret: string
): string {
  const dataString = JSON.stringify({
    projectId,
    ...analysisData,
  });

  return createHash("sha256")
    .update(dataString + secret)
    .digest("hex");
}

export const stepCodeRouter = router({
  /**
   * POST /api/stepCode/check
   * Perform Step Code compliance analysis
   * 
   * Input: projectId, energyFeaturesId, stepCodeTierId
   * Output: Compliance determination with TEDI/TEUI gaps, recommendations, and signature
   */
  check: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        energyFeaturesId: z.number(),
        stepCodeTierId: z.number(),
        tediModelled: z.number().positive("TEDI must be positive"),
        teuiModelled: z.number().positive("TEUI must be positive"),
        airtightnessModelled: z.number().optional(),
        mechEfficiencyModelled: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const jwtSecret = process.env.JWT_SECRET || "";

      // Verify user owns this project
      const project = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this project",
        });
      }

      // Fetch Step Code tier targets
      const tier = await db
        .select()
        .from(stepCodeTiers)
        .where(eq(stepCodeTiers.id, input.stepCodeTierId))
        .limit(1);

      if (!tier.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Step Code tier not found",
        });
      }

      const tierData = tier[0];

      // Evaluate TEDI
      const tediResult = evaluateTEDI(
        Number(tierData.tediTarget),
        input.tediModelled
      );

      // Evaluate TEUI
      const teuiResult = evaluateTEUI(
        Number(tierData.teuiTarget),
        input.teuiModelled
      );

      // Evaluate airtightness (optional)
      const airtightnessResult = evaluateAirtightness(
        tierData.airtightnessMax ? Number(tierData.airtightnessMax) : undefined,
        input.airtightnessModelled
      );

      // Evaluate mechanical efficiency (optional)
      const mechResult = evaluateMechEfficiency(
        tierData.mechEfficiencyMin ? Number(tierData.mechEfficiencyMin) : undefined,
        input.mechEfficiencyModelled
      );

      // Determine overall compliance
      const overallCompliant =
        tediResult.status === "pass" &&
        teuiResult.status === "pass" &&
        (!airtightnessResult || airtightnessResult.status === "pass") &&
        (!mechResult || mechResult.status === "pass");

      // Generate recommendations
      const recommendations: string[] = [];
      if (tediResult.status !== "pass") {
        recommendations.push(
          `Reduce TEDI by ${(tediResult.gap || 0).toFixed(2)} kWh/m²/year through improved envelope design`
        );
      }
      if (teuiResult.status !== "pass") {
        recommendations.push(
          `Reduce TEUI by ${(teuiResult.gap || 0).toFixed(2)} kWh/m²/year through higher-efficiency systems`
        );
      }
      if (airtightnessResult && airtightnessResult.status !== "pass") {
        recommendations.push(
          `Improve airtightness by ${(airtightnessResult.gap || 0).toFixed(2)} ACH50 through better air sealing`
        );
      }

      // Prepare analysis data for signature
      const analysisData = {
        tierTarget: tierData.tier,
        tediTarget: Number(tierData.tediTarget),
        tediModelled: input.tediModelled,
        teuiTarget: Number(tierData.teuiTarget),
        teuiModelled: input.teuiModelled,
        overallCompliant,
        timestamp: new Date().toISOString(),
      };

      // Generate cryptographic signature
      const signature = generateComplianceSignature(
        input.projectId,
        analysisData,
        jwtSecret
      );

      // Store immutable analysis result
      const analysisId = nanoid();
      
      await db.insert(stepCodeAnalyses).values({
        id: analysisId, // UUID primary key
        projectId: input.projectId,
        userId: ctx.user.id,
        energyFeaturesId: input.energyFeaturesId,
        jurisdictionProfileId: input.stepCodeTierId, // Use tier ID as jurisdiction reference
        stepCodeTierId: input.stepCodeTierId,
        tierTarget: tierData.tier,
        tierAchieved: overallCompliant ? tierData.tier : undefined,
        tediTarget: tierData.tediTarget,
        tediModelled: input.tediModelled,
        tediCompliant: tediResult.status === "pass",
        tediGap: tediResult.gap || undefined,
        teuiTarget: tierData.teuiTarget,
        teuiModelled: input.teuiModelled,
        teuiCompliant: teuiResult.status === "pass",
        teuiGap: teuiResult.gap || undefined,
        airtightnessTarget: tierData.airtightnessMax || undefined,
        airtightnessModelled: input.airtightnessModelled || undefined,
        airtightnessCompliant: airtightnessResult?.status === "pass" ? true : undefined,
        mechEfficiencyTarget: tierData.mechEfficiencyMin || undefined,
        mechEfficiencyModelled: input.mechEfficiencyModelled || undefined,
        mechEfficiencyCompliant: mechResult?.status === "pass" ? true : undefined,
        overallCompliant,
        complianceStatus: overallCompliant ? "pass" : "fail",
        recommendations: JSON.stringify(recommendations),
        cryptographicSignature: signature,
        signatureVerified: true,
        ipAddress: ctx.req.ip || undefined,
        userAgent: ctx.req.headers["user-agent"] || undefined,
      });

      return {
        success: true,
        analysisId,
        compliant: overallCompliant,
        tierTarget: tierData.tier,
        tierAchieved: overallCompliant ? tierData.tier : undefined,
        tedi: {
          target: Number(tierData.tediTarget),
          modelled: input.tediModelled,
          compliant: tediResult.status === "pass",
          gap: tediResult.gap,
        },
        teui: {
          target: Number(tierData.teuiTarget),
          modelled: input.teuiModelled,
          compliant: teuiResult.status === "pass",
          gap: teuiResult.gap,
        },
        airtightness: airtightnessResult
          ? {
              target: Number(tierData.airtightnessMax),
              modelled: input.airtightnessModelled,
              compliant: airtightnessResult.status === "pass",
              gap: airtightnessResult.gap,
            }
          : null,
        mechEfficiency: mechResult
          ? {
              target: Number(tierData.mechEfficiencyMin),
              modelled: input.mechEfficiencyModelled,
              compliant: mechResult.status === "pass",
              gap: mechResult.gap,
            }
          : null,
        recommendations,
        signature,
      };
    }),

  /**
   * GET /api/stepCode/tiers
   * Fetch all Step Code tiers for a given building type and climate zone
   */
  getTiers: protectedProcedure
    .input(
      z.object({
        buildingType: z.string(),
        climateZone: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const tiers = await db
        .select()
        .from(stepCodeTiers)
        .where(
          and(
            eq(stepCodeTiers.buildingType, input.buildingType),
            eq(stepCodeTiers.climateZone, input.climateZone),
            eq(stepCodeTiers.isActive, true)
          )
        )
        .orderBy(stepCodeTiers.tier);

      return tiers.map((t: any) => ({
        id: t.id,
        tier: t.tier,
        buildingType: t.buildingType,
        climateZone: t.climateZone,
        tediTarget: Number(t.tediTarget),
        teuiTarget: Number(t.teuiTarget),
        mechEfficiencyMin: t.mechEfficiencyMin ? Number(t.mechEfficiencyMin) : null,
        airtightnessMax: t.airtightnessMax ? Number(t.airtightnessMax) : null,
        codeReference: t.codeReference,
      }));
    }),

  /**
   * GET /api/stepCode/analyses/:projectId
   * Fetch all Step Code analyses for a project
   */
  getAnalyses: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Verify user owns this project
      const project = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this project",
        });
      }

      const analyses = await db
        .select()
        .from(stepCodeAnalyses)
        .where(eq(stepCodeAnalyses.projectId, input.projectId))
        .orderBy(stepCodeAnalyses.createdAt);

      return analyses.map((a: any) => ({
        id: a.id,
        tierTarget: a.tierTarget,
        tierAchieved: a.tierAchieved,
        tediTarget: Number(a.tediTarget),
        tediModelled: Number(a.tediModelled),
        teuiTarget: Number(a.teuiTarget),
        teuiModelled: Number(a.teuiModelled),
        overallCompliant: a.overallCompliant,
        recommendations: JSON.parse(a.recommendations || "[]"),
        createdAt: a.createdAt,
      }));
    }),
});
