/**
 * Correction Service — Phase 5B admin correction + org-aware training data.
 *
 * correctionService is the ONLY place where roomCorrections and trainingExamples
 * are written. It never touches compliance decisions or rule evaluations.
 *
 * getTrainingExamples() implements the org-first, global-fallback hierarchy:
 *   1. Org-specific examples (orgId match, up to 7)
 *   2. Global baseline examples (orgId IS NULL, fills remaining slots to 10)
 */

import { getDb } from "../db";
import { roomCorrections, trainingExamples } from "../../drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export type CorrectionType =
  | "label"
  | "boundingBox"
  | "occupancyGroup"
  | "areaSqm"
  | "floorLevel"
  | "confidence";

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
    correctionType: payload.correctionType,
    previousValue: payload.previousValue,
    correctedValue: payload.correctedValue,
    planType: payload.planType,
    notes: payload.notes ?? null,
    createdAt: new Date(),
  });

  const correctionId = result[0].insertId;
  await generateTrainingExample(payload);
  return correctionId;
}

async function generateTrainingExample(payload: CorrectionPayload): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const contribution = buildPromptContribution(payload);
  if (!contribution) return;

  await db.insert(trainingExamples).values({
    orgId: payload.orgId ?? null,
    planType: payload.planType,
    promptContribution: contribution,
    isActive: 1,
    createdAt: new Date(),
  });
}

function buildPromptContribution(payload: CorrectionPayload): string | null {
  const { correctionType, previousValue, correctedValue } = payload;

  switch (correctionType) {
    case "label":
      return `CORRECTION: Room labeled "${previousValue.label}" was corrected to "${correctedValue.label}". When you see a room that looks like "${correctedValue.label}", use that label.`;
    case "occupancyGroup":
      return `CORRECTION: Room previously classified as occupancy group "${previousValue.occupancyGroup}" was corrected to "${correctedValue.occupancyGroup}".`;
    case "boundingBox":
      return `CORRECTION: Bounding box coordinates were adjusted. The room detection may have been clipping the actual room boundaries.`;
    case "areaSqm":
      return `CORRECTION: Room area estimate of ${previousValue.areaSqm}m² was corrected to ${correctedValue.areaSqm}m².`;
    default:
      return null;
  }
}

/**
 * Fetch training examples for prompt injection.
 *
 * Priority: org-specific (up to 7) → global baseline (fills to 10 total).
 * Returns empty array gracefully if trainingExamples table does not yet exist.
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
    // Table may not exist yet (Phase 5B migration pending) — fail silently
    return [];
  }
}
