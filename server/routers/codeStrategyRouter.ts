import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { codeStrategies, projects } from "../../drizzle/schema";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── NBC Table 3.2.2.2 lookup ──────────────────────────────────────────────────
// maxStoreys: null = unlimited, maxHeightM: null = unlimited, maxAreaM2: null = unlimited
type HeightAreaRow = { maxStoreys: number | null; maxHeightM: number | null; maxAreaM2: number | null };

const NBC_TABLE: Record<string, Record<"sprinklered" | "unsprinklered", HeightAreaRow>> = {
  IA: {
    sprinklered:   { maxStoreys: null, maxHeightM: null,   maxAreaM2: null  },
    unsprinklered: { maxStoreys: 6,    maxHeightM: 18,     maxAreaM2: 7200  },
  },
  IB: {
    sprinklered:   { maxStoreys: null, maxHeightM: null,   maxAreaM2: null  },
    unsprinklered: { maxStoreys: 4,    maxHeightM: 12,     maxAreaM2: 4800  },
  },
  IIA: {
    sprinklered:   { maxStoreys: 12,   maxHeightM: 36,     maxAreaM2: 9600  },
    unsprinklered: { maxStoreys: 3,    maxHeightM: 9,      maxAreaM2: 2400  },
  },
  IIB: {
    sprinklered:   { maxStoreys: 6,    maxHeightM: 18,     maxAreaM2: 4800  },
    unsprinklered: { maxStoreys: 2,    maxHeightM: 6,      maxAreaM2: 1200  },
  },
  IIIA: {
    sprinklered:   { maxStoreys: 6,    maxHeightM: 18,     maxAreaM2: 4800  },
    unsprinklered: { maxStoreys: 3,    maxHeightM: 9,      maxAreaM2: 2400  },
  },
  IIIB: {
    sprinklered:   { maxStoreys: 4,    maxHeightM: 12,     maxAreaM2: 2400  },
    unsprinklered: { maxStoreys: 2,    maxHeightM: 6,      maxAreaM2: 600   },
  },
  IVA: {
    sprinklered:   { maxStoreys: 6,    maxHeightM: 18,     maxAreaM2: 4800  },
    unsprinklered: { maxStoreys: 4,    maxHeightM: 12,     maxAreaM2: 3200  },
  },
  VA: {
    sprinklered:   { maxStoreys: 4,    maxHeightM: 12,     maxAreaM2: 2400  },
    unsprinklered: { maxStoreys: 3,    maxHeightM: 9,      maxAreaM2: 1200  },
  },
  VB: {
    sprinklered:   { maxStoreys: 3,    maxHeightM: 9,      maxAreaM2: 1200  },
    unsprinklered: { maxStoreys: 2,    maxHeightM: 6,      maxAreaM2: 600   },
  },
};

// Travel distance limits — NBC 3.4.2.2.(1)
function travelDistanceLimit(sprinklered: boolean): number {
  return sprinklered ? 45 : 25;
}

// Required fire resistance ratings — NBC 3.2.2.
const FIRE_RATINGS: Record<string, { structure: string; floor: string; exterior: string }> = {
  IA:   { structure: "2 hr",    floor: "1.5 hr", exterior: "2 hr"   },
  IB:   { structure: "1.5 hr",  floor: "1 hr",   exterior: "1.5 hr" },
  IIA:  { structure: "1 hr",    floor: "1 hr",   exterior: "1 hr"   },
  IIB:  { structure: "0 hr",    floor: "0 hr",   exterior: "0 hr"   },
  IIIA: { structure: "1 hr",    floor: "0.75 hr",exterior: "1 hr"   },
  IIIB: { structure: "0 hr",    floor: "0 hr",   exterior: "0 hr"   },
  IVA:  { structure: "1 hr",    floor: "45 min", exterior: "1 hr"   },
  VA:   { structure: "1 hr",    floor: "0.75 hr",exterior: "1 hr"   },
  VB:   { structure: "0 hr",    floor: "0 hr",   exterior: "0 hr"   },
};

interface ComplianceOutputs {
  maxStoreys: number | null;
  maxHeightM: number | null;
  maxAreaM2: number | null;
  travelDistanceLimitM: number;
  fireRatings: { structure: string; floor: string; exterior: string } | null;
  heightResult: "pass" | "fail" | "unknown";
  areaResult: "pass" | "fail" | "unknown";
  storeysResult: "pass" | "fail" | "unknown";
}

function computeCompliance(
  constructionType: string,
  sprinklered: boolean,
  buildingHeightM: number | null,
  buildingAreaM2: number | null,
  storeys: number | null,
): ComplianceOutputs {
  const key = constructionType.toUpperCase();
  const row = NBC_TABLE[key]?.[sprinklered ? "sprinklered" : "unsprinklered"] ?? null;
  const ratings = FIRE_RATINGS[key] ?? null;
  const travelLimit = travelDistanceLimit(sprinklered);

  const heightResult: "pass" | "fail" | "unknown" =
    !row || !buildingHeightM ? "unknown"
    : row.maxHeightM === null ? "pass"
    : buildingHeightM <= row.maxHeightM ? "pass"
    : "fail";

  const areaResult: "pass" | "fail" | "unknown" =
    !row || !buildingAreaM2 ? "unknown"
    : row.maxAreaM2 === null ? "pass"
    : buildingAreaM2 <= row.maxAreaM2 ? "pass"
    : "fail";

  const storeysResult: "pass" | "fail" | "unknown" =
    !row || !storeys ? "unknown"
    : row.maxStoreys === null ? "pass"
    : storeys <= row.maxStoreys ? "pass"
    : "fail";

  return {
    maxStoreys: row?.maxStoreys ?? null,
    maxHeightM: row?.maxHeightM ?? null,
    maxAreaM2: row?.maxAreaM2 ?? null,
    travelDistanceLimitM: travelLimit,
    fireRatings: ratings,
    heightResult,
    areaResult,
    storeysResult,
  };
}

// ── Input schema ──────────────────────────────────────────────────────────────
const codeStrategyInput = z.object({
  projectId: z.number().int().positive(),
  province: z.string().min(2).max(5),
  codeEdition: z.string().min(1).max(20),
  constructionType: z.string().min(1).max(10),
  sprinklered: z.boolean(),
  buildingHeightM: z.number().positive().nullable(),
  buildingAreaM2: z.number().positive().nullable(),
  storeys: z.number().int().positive().nullable(),
  occupancyGroups: z.array(z.string()).min(1),
  egressStrategy: z.string().max(2000).optional(),
  exitCount: z.number().int().min(0).nullable(),
  separationRequired: z.boolean(),
});

// ── Router ────────────────────────────────────────────────────────────────────
export const codeStrategyRouter = router({
  save: protectedProcedure
    .input(codeStrategyInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const compliance = computeCompliance(
        input.constructionType,
        input.sprinklered,
        input.buildingHeightM,
        input.buildingAreaM2,
        input.storeys,
      );

      // Check for existing draft
      const [existing] = await db
        .select({ id: codeStrategies.id, status: codeStrategies.status })
        .from(codeStrategies)
        .where(eq(codeStrategies.projectId, input.projectId))
        .orderBy(desc(codeStrategies.createdAt))
        .limit(1);

      const values = {
        projectId: input.projectId,
        orgId: ctx.user.orgId ?? null,
        createdBy: ctx.user.id,
        province: input.province,
        codeEdition: input.codeEdition,
        constructionType: input.constructionType,
        sprinklered: input.sprinklered ? 1 : 0,
        buildingHeightM: input.buildingHeightM?.toString() ?? null,
        buildingAreaM2: input.buildingAreaM2?.toString() ?? null,
        storeys: input.storeys ?? null,
        occupancyGroups: input.occupancyGroups,
        egressStrategy: input.egressStrategy ?? null,
        exitCount: input.exitCount ?? null,
        separationRequired: input.separationRequired ? 1 : 0,
        strategySummaryJson: compliance,
        status: "draft" as const,
      };

      if (existing && existing.status === "draft") {
        await db.update(codeStrategies).set(values).where(eq(codeStrategies.id, existing.id));
        return { id: existing.id, compliance };
      }

      const result = await db.insert(codeStrategies).values(values);
      return { id: Number(result[0].insertId), compliance };
    }),

  get: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [row] = await db
        .select()
        .from(codeStrategies)
        .where(eq(codeStrategies.projectId, input.projectId))
        .orderBy(desc(codeStrategies.createdAt))
        .limit(1);

      return row ?? null;
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), notes: z.string().max(2000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const isOrgAdmin = ctx.user.role === "org_admin" || ctx.user.role === "admin";
      if (!isOrgAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Only org admins may approve code strategies" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [row] = await db.select().from(codeStrategies).where(eq(codeStrategies.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(codeStrategies)
        .set({ status: "approved", approvedBy: ctx.user.id, approvedAt: new Date() })
        .where(eq(codeStrategies.id, input.id));

      // Record permit review
      if (row.orgId) {
        const { permitReviews } = await import("../../drizzle/schema");
        await db.insert(permitReviews).values({
          projectId: row.projectId,
          orgId: row.orgId,
          reviewedBy: ctx.user.id,
          reviewType: "code_strategy",
          decision: "approved",
          notes: input.notes ?? null,
        });
      }

      return { success: true };
    }),

  generatePDF: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [cs] = await db.select().from(codeStrategies).where(eq(codeStrategies.id, input.id)).limit(1);
      if (!cs) throw new TRPCError({ code: "NOT_FOUND", message: "Code strategy not found" });

      const [proj] = await db.select().from(projects).where(eq(projects.id, cs.projectId)).limit(1);

      const sprinklered = Boolean(cs.sprinklered);
      const compliance = computeCompliance(
        cs.constructionType,
        sprinklered,
        cs.buildingHeightM ? parseFloat(cs.buildingHeightM as string) : null,
        cs.buildingAreaM2 ? parseFloat(cs.buildingAreaM2 as string) : null,
        cs.storeys ?? null,
      );

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const BRAND: [number, number, number] = [30, 64, 175];
      const LIGHT: [number, number, number] = [240, 244, 255];
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ── Header banner ──────────────────────────────────────────────────────
      doc.setFillColor(...BRAND);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CodeComply Pro — Code Strategy", 14, 10);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated ${new Date().toLocaleDateString("en-CA")}`, 14, 17);

      // ── Project info ───────────────────────────────────────────────────────
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(proj?.name ?? `Project #${cs.projectId}`, 14, 32);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      if (proj?.address) doc.text(proj.address, 14, 38);
      doc.text(`${cs.province} · ${cs.codeEdition}`, 14, proj?.address ? 44 : 38);

      let y = proj?.address ? 52 : 46;

      // ── Construction parameters ────────────────────────────────────────────
      autoTable(doc, {
        startY: y,
        head: [["Parameter", "Value"]],
        body: [
          ["Construction Type", cs.constructionType],
          ["Sprinklered", sprinklered ? "Yes" : "No"],
          ["Building Height", cs.buildingHeightM ? `${parseFloat(cs.buildingHeightM as string).toFixed(2)} m` : "—"],
          ["Building Area", cs.buildingAreaM2 ? `${parseFloat(cs.buildingAreaM2 as string).toFixed(1)} m²` : "—"],
          ["Storeys", cs.storeys?.toString() ?? "—"],
          ["Occupancy Groups", (cs.occupancyGroups as string[] ?? []).join(", ")],
          ["Exit Count", cs.exitCount?.toString() ?? "—"],
          ["Fire Separation Required", cs.separationRequired ? "Yes" : "No"],
        ],
        headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: 14, right: 14 },
        tableWidth: pageW - 28,
      });

      y = (doc as any).lastAutoTable.finalY + 8;

      // ── Auto-computed compliance outputs ───────────────────────────────────
      const resultLabel = (r: "pass" | "fail" | "unknown") =>
        r === "pass" ? "PASS" : r === "fail" ? "FAIL" : "—";

      const unlimited = (v: number | null) => (v === null ? "Unlimited" : String(v));

      const complianceRows: [string, string, string][] = [
        [
          "Max Allowable Storeys (NBC 3.2.2.2)",
          unlimited(compliance.maxStoreys),
          resultLabel(compliance.storeysResult),
        ],
        [
          "Max Allowable Height (NBC 3.2.2.2)",
          compliance.maxHeightM === null ? "Unlimited" : `${compliance.maxHeightM} m`,
          resultLabel(compliance.heightResult),
        ],
        [
          "Max Area per Floor (NBC 3.2.2.2)",
          compliance.maxAreaM2 === null ? "Unlimited" : `${compliance.maxAreaM2.toLocaleString()} m²`,
          resultLabel(compliance.areaResult),
        ],
        [
          "Travel Distance Limit (NBC 3.4.2.2)",
          `${compliance.travelDistanceLimitM} m`,
          "—",
        ],
        [
          "Structure Fire Resistance (NBC 3.2.2.)",
          compliance.fireRatings?.structure ?? "—",
          "—",
        ],
        [
          "Floor/Ceiling Assembly (NBC 3.2.2.)",
          compliance.fireRatings?.floor ?? "—",
          "—",
        ],
        [
          "Exterior Wall Assembly (NBC 3.2.2.)",
          compliance.fireRatings?.exterior ?? "—",
          "—",
        ],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Requirement", "Limit / Rating", "Status"]],
        body: complianceRows,
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30, fontStyle: "bold" },
        },
        didDrawCell: (data: any) => {
          if (data.column.index === 2 && data.section === "body") {
            const val = String(data.cell.raw);
            if (val === "PASS") doc.setTextColor(22, 101, 52);
            else if (val === "FAIL") doc.setTextColor(185, 28, 28);
            else doc.setTextColor(80, 80, 80);
          }
        },
        margin: { left: 14, right: 14 },
        tableWidth: pageW - 28,
      });

      y = (doc as any).lastAutoTable.finalY + 8;

      // ── Egress strategy ────────────────────────────────────────────────────
      if (cs.egressStrategy) {
        if (y > pageH - 60) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("Egress Strategy", 14, y);
        y += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(cs.egressStrategy, pageW - 28) as string[];
        doc.text(lines, 14, y);
        y += lines.length * 5 + 6;
      }

      // ── Approval status ────────────────────────────────────────────────────
      if (y > pageH - 50) { doc.addPage(); y = 20; }
      doc.setDrawColor(...BRAND);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, pageW - 28, 22, 2, 2, "S");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Approval Status", 18, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const statusLine = cs.status === "approved" && cs.approvedAt
        ? `Approved on ${new Date(cs.approvedAt).toLocaleDateString("en-CA")} (User ID ${cs.approvedBy})`
        : cs.status === "draft"
        ? "Draft — pending org admin approval"
        : "Superseded";
      doc.text(statusLine, 18, y + 14);
      y += 28;

      // ── Professional stamp block ───────────────────────────────────────────
      if (y > pageH - 50) { doc.addPage(); y = 20; }
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, pageW - 28, 30, 2, 2, "S");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Professional Stamp", 18, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text("Name: ___________________________  Designation: ____________", 18, y + 14);
      doc.text("License #: __________________  Signature: ___________________________", 18, y + 21);

      // ── Footer ─────────────────────────────────────────────────────────────
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `CodeComply Pro · Code Strategy · ${new Date().toLocaleDateString("en-CA")} · Report ID ${cs.id}`,
        pageW / 2,
        pageH - 8,
        { align: "center" },
      );

      const base64 = doc.output("datauristring");
      return { base64, filename: `code-strategy-project-${cs.projectId}.pdf` };
    }),
});
