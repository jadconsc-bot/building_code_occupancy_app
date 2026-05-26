/**
 * Correction Service — Phase 5B admin correction + org-aware training data.
 *
 * Iron Law: This service improves LLM prompts only. Corrections never modify
 * the rule engine, occupancy classifications, or any compliance determination.
 *
 * getTrainingExamples() implements the org-first, global-fallback hierarchy:
 *   1. Org-specific examples (orgId match, up to 7)
 *   2. Global baseline examples (orgId IS NULL, fills remaining slots to 10)
 */

import { getDb } from "../db";
import { roomCorrections, trainingExamples, detectedRooms } from "../../drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export type CorrectionType =
  | "label_rename"
  | "occupancy_change"
  | "boundary_redraw"
  | "false_positive_delete"
  | "missing_room_add";

export interface CorrectionPayload {
  roomId: number;
  pageId: number;
  correctedBy: number;
  orgId?: number | null;
  correctionType: CorrectionType;
  previousValue: Record<string, unknown>;
  correctedValue: Record<string, unknown>;
  planType: string;
  notes?: string;
}

export async function saveCorrection(payload: CorrectionPayload): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.insert(roomCorrections).values({
    roomId: payload.roomId,
    pageId: payload.pageId,
    correctedBy: payload.correctedBy,
    orgId: payload.orgId ?? null,
    correctedAt: new Date(),
    correctionType: payload.correctionType,
    previousValueJson: payload.previousValue,
    correctedValueJson: payload.correctedValue,
    planType: payload.planType,
    addedToTraining: 1,
    trainingWeight: "1.00",
    notes: payload.notes ?? null,
  });

  const correctionId = result[0].insertId;

  await applyCorrection(payload);
  await generateTrainingExample(correctionId, payload);

  return correctionId;
}

async function applyCorrection(payload: CorrectionPayload): Promise<void> {
  const db = await getDb();
  if (!db) return;

  switch (payload.correctionType) {
    case "label_rename":
      await db.update(detectedRooms)
        .set({
          roomLabel: payload.correctedValue.label as string,
          correctionCount: db.$count(detectedRooms, eq(detectedRooms.id, payload.roomId)) as any,
          lastCorrectedAt: new Date(),
        })
        .where(eq(detectedRooms.id, payload.roomId));
      // Simpler update without the subquery count:
      await db.update(detectedRooms)
        .set({ roomLabel: payload.correctedValue.label as string, lastCorrectedAt: new Date() })
        .where(eq(detectedRooms.id, payload.roomId));
      break;

    case "occupancy_change":
      await db.update(detectedRooms)
        .set({ occupancyGroup: payload.correctedValue.occupancyGroup as string, lastCorrectedAt: new Date() })
        .where(eq(detectedRooms.id, payload.roomId));
      break;

    case "boundary_redraw":
      await db.update(detectedRooms)
        .set({
          boundingBoxJson: JSON.stringify(payload.correctedValue.boundingBox),
          polygonJson: payload.correctedValue.polygon
            ? JSON.stringify(payload.correctedValue.polygon)
            : null,
          polygonSource: "manual",
          polygonExtractedAt: new Date(),
          lastCorrectedAt: new Date(),
        })
        .where(eq(detectedRooms.id, payload.roomId));
      break;

    case "false_positive_delete":
      await db.update(detectedRooms)
        .set({ flaggedForReview: 1, manualOverride: 1, lastCorrectedAt: new Date() })
        .where(eq(detectedRooms.id, payload.roomId));
      break;

    case "missing_room_add":
      await db.insert(detectedRooms).values({
        pageId: payload.pageId,
        projectId: payload.correctedValue.projectId as number,
        roomLabel: payload.correctedValue.label as string,
        boundingBoxJson: JSON.stringify(payload.correctedValue.boundingBox),
        polygonJson: payload.correctedValue.polygon
          ? JSON.stringify(payload.correctedValue.polygon)
          : null,
        polygonSource: "manual",
        areaSqm: payload.correctedValue.areaSqm != null
          ? String(payload.correctedValue.areaSqm)
          : "0.00",
        occupancyGroup: payload.correctedValue.occupancyGroup as string,
        confidence: "1.000",
        flaggedForReview: 0,
        manualOverride: 1,
        createdAt: new Date(),
      });
      return; // skip correctionCount update — new room, no existing row
  }

  // Increment correction counter
  const [existing] = await db
    .select({ correctionCount: detectedRooms.correctionCount })
    .from(detectedRooms)
    .where(eq(detectedRooms.id, payload.roomId))
    .limit(1);
  if (existing) {
    await db.update(detectedRooms)
      .set({ correctionCount: (existing.correctionCount ?? 0) + 1, lastCorrectedAt: new Date() })
      .where(eq(detectedRooms.id, payload.roomId));
  }
}

async function generateTrainingExample(
  correctionId: number,
  payload: CorrectionPayload,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const promptContribution = buildPromptContribution(payload);
  if (!promptContribution) return;

  await db.insert(trainingExamples).values({
    orgId: payload.orgId ?? null,
    planType: payload.planType,
    correctionId,
    promptContribution,
    isActive: 1,
    createdAt: new Date(),
  });
}

function buildPromptContribution(payload: CorrectionPayload): string | null {
  const { correctionType, previousValue, correctedValue, planType } = payload;

  switch (correctionType) {
    case "label_rename":
      return (
        `CORRECTION: Room labeled "${previousValue.label}" ` +
        `should be "${correctedValue.label}" for ${planType} drawings.`
      );
    case "occupancy_change":
      return (
        `CORRECTION: Room "${previousValue.label}" ` +
        `occupancy group changed from ${previousValue.occupancyGroup} ` +
        `to ${correctedValue.occupancyGroup} in ${planType} drawings.`
      );
    case "boundary_redraw":
      return (
        `CORRECTION: Room "${previousValue.label}" boundary was redrawn. ` +
        `Tighter fit to wall lines required in ${planType} drawings.`
      );
    case "false_positive_delete":
      return (
        `CORRECTION: "${previousValue.label}" is NOT a room — ` +
        `it is ${payload.notes ?? "a non-room element"} in ${planType} drawings. Do not detect.`
      );
    case "missing_room_add":
      return (
        `CORRECTION: Room "${correctedValue.label}" (${correctedValue.occupancyGroup}) ` +
        `was missed. Look for this room type in ${planType} drawings.`
      );
    default:
      return null;
  }
}

/**
 * Fetch training examples for prompt injection.
 *
 * Priority: org-specific (up to 7) → global baseline (fills to 10 total).
 * Returns empty array gracefully if table does not yet exist.
 */
export async function getTrainingExamples(
  planType: string,
  orgId?: number | null,
): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const results: string[] = [];

    if (orgId) {
      const orgExamples = await db
        .select({ promptContribution: trainingExamples.promptContribution })
        .from(trainingExamples)
        .where(
          and(
            eq(trainingExamples.planType, planType),
            eq(trainingExamples.orgId, orgId),
            eq(trainingExamples.isActive, 1),
          )
        )
        .orderBy(desc(trainingExamples.createdAt))
        .limit(7);

      results.push(...orgExamples.map(e => e.promptContribution));
    }

    const remaining = 10 - results.length;
    if (remaining > 0) {
      const globalExamples = await db
        .select({ promptContribution: trainingExamples.promptContribution })
        .from(trainingExamples)
        .where(
          and(
            eq(trainingExamples.planType, planType),
            isNull(trainingExamples.orgId),
            eq(trainingExamples.isActive, 1),
          )
        )
        .orderBy(desc(trainingExamples.createdAt))
        .limit(remaining);

      results.push(...globalExamples.map(e => e.promptContribution));
    }

    return results;
  } catch {
    return [];
  }
}
