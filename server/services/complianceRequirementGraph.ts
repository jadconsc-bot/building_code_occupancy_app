import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  complianceRequirementSnapshots,
  complianceResults,
  complianceRequirements,
  requirementDependencies,
} from "../../drizzle/schema";
import { getDb } from "../db";

export type RequirementStatus = "compliant" | "violation" | "insufficient-evidence" | "stale";
export type RequirementSource = "ai-extracted" | "user-confirmed" | "derived";

export interface RequirementCandidate {
  provisionRef: string;
  requirementType: string;
  appliesTo: { kind: "Wall" | "Door" | "Room" | "DwellingUnit"; id: string };
  requiredValue: { value: unknown; unit?: string };
  actualValue: { value: unknown; unit?: string; confirmed: boolean; source: RequirementSource } | null;
  status: RequirementStatus;
  triggeredBy: Array<{ fact: string; value: unknown; factRefId?: string }>;
  dependsOnKeys?: string[];
}

export interface PersistedRequirementGraph {
  created: boolean;
  snapshotVersion: number;
  requirements: Array<RequirementCandidate & { id: string; supersedes?: string; dependsOn: string[]; dependents: string[] }>;
  dependencies: Array<{ requirementId: string; dependsOnRequirementId: string }>;
}

export interface RequirementGraphSnapshot {
  snapshotVersion: number;
  contentHash: string;
  createdAt: Date;
  requirements: Array<RequirementCandidate & {
    id: string;
    supersedes?: string;
    dependsOn: string[];
    dependents: string[];
  }>;
  dependencies: Array<{ requirementId: string; dependsOnRequirementId: string }>;
}

/** Load one consistent, latest FRR graph snapshot for document/report generation. */
export async function getRequirementGraph(projectId: number, scope: string): Promise<RequirementGraphSnapshot | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [snapshot] = await db
    .select()
    .from(complianceRequirementSnapshots)
    .where(and(
      eq(complianceRequirementSnapshots.projectId, projectId),
      eq(complianceRequirementSnapshots.scope, scope),
    ))
    .orderBy(desc(complianceRequirementSnapshots.snapshotVersion))
    .limit(1);
  if (!snapshot) return null;

  const rows = await db
    .select()
    .from(complianceRequirements)
    .where(and(
      eq(complianceRequirements.projectId, projectId),
      eq(complianceRequirements.snapshotVersion, snapshot.snapshotVersion),
    ));
  if (rows.length === 0) return null;

  const ids = rows.map(row => row.id);
  const allDependencies = await db
    .select()
    .from(requirementDependencies)
    .where(eq(requirementDependencies.projectId, projectId));
  const dependencies = allDependencies
    .filter(dep => ids.includes(dep.requirementId) && ids.includes(dep.dependsOnRequirementId))
    .map(dep => ({ requirementId: dep.requirementId, dependsOnRequirementId: dep.dependsOnRequirementId }));

  const dependencyMap = new Map<string, string[]>();
  const dependentMap = new Map<string, string[]>();
  for (const dependency of dependencies) {
    dependencyMap.set(dependency.requirementId, [
      ...(dependencyMap.get(dependency.requirementId) ?? []),
      dependency.dependsOnRequirementId,
    ]);
    dependentMap.set(dependency.dependsOnRequirementId, [
      ...(dependentMap.get(dependency.dependsOnRequirementId) ?? []),
      dependency.requirementId,
    ]);
  }

  return {
    snapshotVersion: snapshot.snapshotVersion,
    contentHash: snapshot.contentHash,
    createdAt: snapshot.createdAt,
    requirements: rows.map(row => ({
      provisionRef: row.provisionRef,
      requirementType: row.requirementType,
      appliesTo: row.appliesTo as RequirementCandidate["appliesTo"],
      requiredValue: row.requiredValue as RequirementCandidate["requiredValue"],
      actualValue: row.actualValue as RequirementCandidate["actualValue"],
      status: row.status as RequirementStatus,
      triggeredBy: row.triggeredBy as RequirementCandidate["triggeredBy"],
      id: row.id,
      dependsOn: dependencyMap.get(row.id) ?? [],
      dependents: dependentMap.get(row.id) ?? [],
      ...(row.supersedes ? { supersedes: row.supersedes } : {}),
    })),
    dependencies,
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

export function requirementLogicalKey(candidate: Pick<RequirementCandidate, "requirementType" | "provisionRef" | "appliesTo">): string {
  return [candidate.requirementType, candidate.provisionRef, candidate.appliesTo.kind, candidate.appliesTo.id].join(":");
}

function contentHash(candidates: RequirementCandidate[]): string {
  const normalized = candidates
    .map(candidate => ({
      ...candidate,
      dependsOnKeys: [...(candidate.dependsOnKeys ?? [])].sort(),
    }))
    .sort((a, b) => requirementLogicalKey(a).localeCompare(requirementLogicalKey(b)));
  return createHash("sha256").update(JSON.stringify(canonicalize(normalized))).digest("hex");
}

function legacyStatus(status: RequirementStatus): "pass" | "fail" | "warning" {
  if (status === "compliant") return "pass";
  if (status === "violation") return "fail";
  return "warning";
}

function legacyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export async function persistRequirementGraph(
  projectId: number,
  candidates: RequirementCandidate[],
  scope: string,
): Promise<PersistedRequirementGraph> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (candidates.length === 0) return { created: false, snapshotVersion: 0, requirements: [], dependencies: [] };

  return db.transaction(async (tx) => {
    const hash = contentHash(candidates);
    const [latest] = await tx
      .select()
      .from(complianceRequirementSnapshots)
      .where(and(eq(complianceRequirementSnapshots.projectId, projectId), eq(complianceRequirementSnapshots.scope, scope)))
      .orderBy(desc(complianceRequirementSnapshots.snapshotVersion))
      .limit(1);

    if (latest?.contentHash === hash) {
      const rows = await tx.select().from(complianceRequirements).where(and(
        eq(complianceRequirements.projectId, projectId),
        eq(complianceRequirements.snapshotVersion, latest.snapshotVersion),
      ));
      const ids = rows.map(row => row.id);
      const deps = ids.length === 0 ? [] : await tx.select().from(requirementDependencies).where(eq(requirementDependencies.projectId, projectId));
      const graphDeps = deps.filter(dep => ids.includes(dep.requirementId) && ids.includes(dep.dependsOnRequirementId));
      const dependencyMap = new Map<string, string[]>();
      const dependentMap = new Map<string, string[]>();
      for (const dep of graphDeps) {
        dependencyMap.set(dep.requirementId, [...(dependencyMap.get(dep.requirementId) ?? []), dep.dependsOnRequirementId]);
        dependentMap.set(dep.dependsOnRequirementId, [...(dependentMap.get(dep.dependsOnRequirementId) ?? []), dep.requirementId]);
      }
      return {
        created: false,
        snapshotVersion: latest.snapshotVersion,
        requirements: rows.map(row => ({
          provisionRef: row.provisionRef,
          requirementType: row.requirementType,
          appliesTo: row.appliesTo as RequirementCandidate["appliesTo"],
          requiredValue: row.requiredValue as RequirementCandidate["requiredValue"],
          actualValue: row.actualValue as RequirementCandidate["actualValue"],
          status: row.status as RequirementStatus,
          triggeredBy: row.triggeredBy as RequirementCandidate["triggeredBy"],
          id: row.id,
          dependsOn: dependencyMap.get(row.id) ?? [],
          dependents: dependentMap.get(row.id) ?? [],
          ...(row.supersedes ? { supersedes: row.supersedes } : {}),
        })),
        dependencies: graphDeps.map(dep => ({ requirementId: dep.requirementId, dependsOnRequirementId: dep.dependsOnRequirementId })),
      };
    }

    const previousVersion = latest?.snapshotVersion ?? 0;
    const previousRows = previousVersion > 0
      ? await tx.select().from(complianceRequirements).where(and(
          eq(complianceRequirements.projectId, projectId),
          eq(complianceRequirements.snapshotVersion, previousVersion),
        ))
      : [];
    const previousByKey = new Map(previousRows.map(row => [requirementLogicalKey({
      requirementType: row.requirementType,
      provisionRef: row.provisionRef,
      appliesTo: row.appliesTo as RequirementCandidate["appliesTo"],
    }), row.id]));

    const snapshotVersion = previousVersion + 1;
    const idsByKey = new Map<string, string>();
    const persisted = candidates.map(candidate => {
      const id = randomUUID();
      idsByKey.set(requirementLogicalKey(candidate), id);
      return { ...candidate, id, supersedes: previousByKey.get(requirementLogicalKey(candidate)) };
    });

    await tx.insert(complianceRequirementSnapshots).values({
      id: randomUUID(), projectId, snapshotVersion, scope, contentHash: hash,
    });
    await tx.insert(complianceRequirements).values(persisted.map(row => ({
      id: row.id,
      projectId,
      snapshotVersion,
      provisionRef: row.provisionRef,
      requirementType: row.requirementType,
      appliesTo: row.appliesTo,
      requiredValue: row.requiredValue,
      actualValue: row.actualValue,
      status: row.status,
      triggeredBy: row.triggeredBy,
      supersedes: row.supersedes ?? null,
    })) as any);

    // Dependency keys may point at a requirement emitted by an earlier,
    // separately persisted scope (for example washroom-count depends on
    // occupant-load). Resolve the most recent existing logical key across
    // scopes, while preferring IDs created in this snapshot for same-scope
    // dependencies.
    const existingRequirements = await tx.select().from(complianceRequirements)
      .where(eq(complianceRequirements.projectId, projectId))
      .orderBy(desc(complianceRequirements.createdAt));
    const existingIdsByKey = new Map<string, string>();
    for (const existing of existingRequirements) {
      const key = requirementLogicalKey({
        requirementType: existing.requirementType,
        provisionRef: existing.provisionRef,
        appliesTo: existing.appliesTo as RequirementCandidate["appliesTo"],
      });
      if (!existingIdsByKey.has(key)) existingIdsByKey.set(key, existing.id);
    }

    const dependencies: Array<{ requirementId: string; dependsOnRequirementId: string }> = [];
    for (const row of persisted) {
      for (const key of row.dependsOnKeys ?? []) {
        const dependsOnRequirementId = idsByKey.get(key) ?? existingIdsByKey.get(key);
        if (dependsOnRequirementId) dependencies.push({ requirementId: row.id, dependsOnRequirementId });
      }
    }
    if (dependencies.length > 0) {
      await tx.insert(requirementDependencies).values(dependencies.map(dep => ({ id: randomUUID(), projectId, ...dep })));
    }

    const legacyCategory = `orchestrator-${scope}`;
    const projectionRemediation = scope === "frr"
      ? "Confirm the fire-resistance rating from the drawings."
      : "Review the requirement evidence and applicable code provisions.";
    await tx.delete(complianceResults).where(and(
      eq(complianceResults.projectId, projectId),
      eq(complianceResults.ruleCategory, legacyCategory),
    ));
    const projectionPrefix = `${legacyCategory}.`;
    const projectionRows = persisted.filter(row =>
      row.requirementType.startsWith(`${projectionPrefix}fire-separation`) ||
      row.requirementType.startsWith(`${projectionPrefix}stack-separation`)
    );
    if (projectionRows.length > 0) {
      await tx.insert(complianceResults).values(projectionRows.map(row => ({
        projectId,
        roomId: row.appliesTo.kind === "Room" && /^\d+$/.test(row.appliesTo.id) ? Number(row.appliesTo.id) : null,
        ruleReference: row.provisionRef,
        ruleCategory: legacyCategory,
        ruleText: `FRR requirement for ${row.appliesTo.id}`,
        status: legacyStatus(row.status),
        actualValue: row.actualValue ? legacyValue(row.actualValue.value) : null,
        requiredValue: legacyValue(row.requiredValue.value),
        remediationSuggestion: row.status === "insufficient-evidence" ? projectionRemediation : null,
        confidence: null,
        severity: row.status === "violation" ? "high" : row.status === "insufficient-evidence" ? "medium" : "info",
        constraintId: `${legacyCategory}:${createHash("sha256").update(requirementLogicalKey(row)).digest("hex").slice(0, 32)}`,
        overrideChain: null,
      })) as any);
    }

    const dependencyMap = new Map<string, string[]>();
    const dependentMap = new Map<string, string[]>();
    for (const dep of dependencies) {
      dependencyMap.set(dep.requirementId, [...(dependencyMap.get(dep.requirementId) ?? []), dep.dependsOnRequirementId]);
      dependentMap.set(dep.dependsOnRequirementId, [...(dependentMap.get(dep.dependsOnRequirementId) ?? []), dep.requirementId]);
    }
    return {
      created: true,
      snapshotVersion,
      requirements: persisted.map(row => ({
        ...row,
        dependsOn: dependencyMap.get(row.id) ?? [],
        dependents: dependentMap.get(row.id) ?? [],
      })),
      dependencies,
    };
  });
}
