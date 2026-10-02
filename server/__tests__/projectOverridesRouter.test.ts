import { beforeEach, describe, expect, it, vi } from "vitest";
import { professionalSeals, projectConstraintOverrides } from "../../drizzle/schema";
import { getDb } from "../db";
import { projectOverridesRouter, professionalSealIsUsable } from "../routers/projectOverridesRouter";

vi.mock("../db", () => ({ getDb: vi.fn() }));

const caller = projectOverridesRouter.createCaller({
  user: { id: 7, role: "professional" },
  req: {},
  res: {},
} as any);

describe("project constraint override annotations", () => {
  let seal: any;
  let inserted: any;
  beforeEach(() => {
    seal = { id: 3, userId: 7, engineerName: "A. Engineer", licenseNumber: "P.123", association: "APEGA", associationProvince: "AB", isActive: true, licenseExpiry: null };
    inserted = null;
    const db: any = {
      select: vi.fn(() => ({
        from: (table: any) => ({
          where: vi.fn(() => {
            const rows = table === professionalSeals ? (seal ? [seal] : []) : [
              { id: 2, constraintId: "b", createdAt: new Date("2026-01-02") },
              { id: 1, constraintId: "a", createdAt: new Date("2026-01-01") },
            ];
            return { limit: vi.fn().mockResolvedValue(rows), orderBy: vi.fn().mockResolvedValue(rows) };
          }),
        }),
      })),
      insert: vi.fn(() => ({ values: vi.fn((value: any) => { inserted = value; return { $returningId: async () => [{ id: 9 }] }; }) })),
    };
    vi.mocked(getDb).mockResolvedValue(db);
  });

  it("rejects when no seal exists", async () => {
    seal = null;
    await expect(caller.create({ projectId: 1, snapshotId: "snap-1", constraintId: "x", assertedValue: "acceptable", justification: "A sufficiently detailed professional justification." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an expired seal", async () => {
    seal.licenseExpiry = new Date("2020-01-01");
    await expect(caller.create({ projectId: 1, snapshotId: "snap-1", constraintId: "x", assertedValue: "acceptable", justification: "A sufficiently detailed professional justification." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("snapshots credentials when a current seal exists", async () => {
    await caller.create({ projectId: 1, snapshotId: "snap-1", constraintId: "x", assertedValue: "acceptable", justification: "A sufficiently detailed professional justification." });
    expect(inserted).toMatchObject({ createdByUserId: 7, credentialEngineerName: "A. Engineer", credentialLicenseNumber: "P.123", credentialAssociation: "APEGA" });
  });

  it("recognizes active, non-expired seals and lists newest first", async () => {
    expect(professionalSealIsUsable(seal, new Date("2026-01-01"))).toBe(true);
    expect(professionalSealIsUsable({ ...seal, isActive: false })).toBe(false);
    expect((await caller.listForSnapshot({ snapshotId: "snap-1" })).map((row) => row.id)).toEqual([2, 1]);
  });
});
