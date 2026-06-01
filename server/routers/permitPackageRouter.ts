import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  projects,
  codeStrategies,
  calculationsPackages,
  permitReviews,
  drawingAnalyses,
  projectCalculatorResults,
} from "../../drizzle/schema";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface OccupantGroupRow {
  group: string;
  areaSqm: number;
  persons: number;
  factor: number;
}

interface CalcSummary {
  totalOccupantLoad: number;
  exitWidthRequiredMm: number;
  travelDistancePass: number;
  travelDistanceFail: number;
  travelDistanceUnable: number;
  totalAreaM2: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resultLabel(r: "pass" | "fail" | "unknown" | undefined): string {
  if (r === "pass") return "PASS";
  if (r === "fail") return "FAIL";
  return "—";
}

function resultColor(r: string): [number, number, number] {
  if (r === "PASS") return [22, 163, 74];
  if (r === "FAIL") return [220, 38, 38];
  return [107, 114, 128];
}

function addSectionHeader(doc: jsPDF, text: string, y: number, pageW: number, M: number): number {
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(M, y, pageW - 2 * M, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(text, M + 3, y + 5.5);
  doc.setTextColor(0, 0, 0);
  return y + 12;
}

async function fetchPackageData(projectId: number, db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

  const [strategy] = await db
    .select()
    .from(codeStrategies)
    .where(eq(codeStrategies.projectId, projectId))
    .orderBy(desc(codeStrategies.createdAt))
    .limit(1);

  const [calcPkg] = await db
    .select()
    .from(calculationsPackages)
    .where(eq(calculationsPackages.projectId, projectId))
    .orderBy(desc(calculationsPackages.createdAt))
    .limit(1);

  const [latestDrawing] = await db
    .select({ id: drawingAnalyses.id, complianceScore: drawingAnalyses.complianceScore, complianceLevel: drawingAnalyses.complianceLevel })
    .from(drawingAnalyses)
    .where(eq(drawingAnalyses.projectId, projectId))
    .orderBy(desc(drawingAnalyses.createdAt))
    .limit(1);

  const [pkgReview] = await db
    .select()
    .from(permitReviews)
    .where(
      and(
        eq(permitReviews.projectId, projectId),
        eq(permitReviews.reviewType, "permit_package"),
      ),
    )
    .orderBy(desc(permitReviews.reviewedAt))
    .limit(1);

  return { project, strategy, calcPkg, latestDrawing, pkgReview };
}

// ── Router ────────────────────────────────────────────────────────────────────
export const permitPackageRouter = router({

  // ── generate ────────────────────────────────────────────────────────────────
  generate: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "org_admin" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only org admins may generate the final permit package" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

      // Verify at least a code strategy exists
      const [strategy] = await db
        .select({ id: codeStrategies.id })
        .from(codeStrategies)
        .where(eq(codeStrategies.projectId, input.projectId))
        .orderBy(desc(codeStrategies.createdAt))
        .limit(1);

      if (!strategy) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No code strategy found for this project. Complete Stage 3 first." });
      }

      // Supersede any existing permit_package review
      const existingReviews = await db
        .select({ id: permitReviews.id })
        .from(permitReviews)
        .where(
          and(
            eq(permitReviews.projectId, input.projectId),
            eq(permitReviews.reviewType, "permit_package"),
          ),
        );

      // Insert new approved permit_package review
      await db.insert(permitReviews).values({
        projectId: input.projectId,
        orgId:     ctx.user.orgId ?? 0,
        reviewedBy: ctx.user.id,
        reviewType: "permit_package",
        decision:   "approved",
        notes:      `Permit package compiled by ${ctx.user.name ?? ctx.user.id} on ${new Date().toISOString()}`,
      });

      return { generated: true, reviewCount: existingReviews.length + 1 };
    }),

  // ── getStatus ────────────────────────────────────────────────────────────────
  getStatus: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [project] = await db.select({ id: projects.id, userId: projects.userId }).from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "org_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [strategy] = await db
        .select({ id: codeStrategies.id, status: codeStrategies.status, approvedAt: codeStrategies.approvedAt })
        .from(codeStrategies)
        .where(eq(codeStrategies.projectId, input.projectId))
        .orderBy(desc(codeStrategies.createdAt))
        .limit(1);

      const [calcPkg] = await db
        .select({ id: calculationsPackages.id, status: calculationsPackages.status, approvedAt: calculationsPackages.approvedAt })
        .from(calculationsPackages)
        .where(eq(calculationsPackages.projectId, input.projectId))
        .orderBy(desc(calculationsPackages.createdAt))
        .limit(1);

      const [pkgReview] = await db
        .select()
        .from(permitReviews)
        .where(
          and(
            eq(permitReviews.projectId, input.projectId),
            eq(permitReviews.reviewType, "permit_package"),
          ),
        )
        .orderBy(desc(permitReviews.reviewedAt))
        .limit(1);

      const strategyApproved  = strategy?.status === "approved";
      const calcApproved      = calcPkg?.status === "approved";
      const packageGenerated  = pkgReview?.decision === "approved";
      const readyForSubmission = strategyApproved && calcApproved && packageGenerated;

      return {
        codeStrategy: {
          exists:     !!strategy,
          status:     strategy?.status ?? null,
          approvedAt: strategy?.approvedAt ?? null,
        },
        calculations: {
          exists:     !!calcPkg,
          status:     calcPkg?.status ?? null,
          approvedAt: calcPkg?.approvedAt ?? null,
        },
        permitPackage: {
          exists:     !!pkgReview,
          status:     pkgReview ? "approved" : null,
          approvedAt: pkgReview?.reviewedAt ?? null,
          reviewId:   pkgReview?.id ?? null,
          submittedDate:           pkgReview?.submittedDate ?? null,
          permitApplicationNumber: pkgReview?.permitApplicationNumber ?? null,
          reviewingAuthority:      pkgReview?.reviewingAuthority ?? null,
          submissionStatus:        pkgReview?.submissionStatus ?? "not_submitted",
          permitNumber:            pkgReview?.permitNumber ?? null,
        },
        readyForSubmission,
      };
    }),

  // ── generatePDF ──────────────────────────────────────────────────────────────
  generatePDF: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [projectCheck] = await db.select({ id: projects.id, userId: projects.userId }).from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!projectCheck) throw new TRPCError({ code: "NOT_FOUND" });
      if (projectCheck.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "org_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { project, strategy, calcPkg, pkgReview } = await fetchPackageData(input.projectId, db);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const allCalcResults = await db
        .select()
        .from(projectCalculatorResults)
        .where(eq(projectCalculatorResults.projectId, input.projectId))
        .orderBy(desc(projectCalculatorResults.updatedAt));

      const getCalc = (type: string): Record<string, unknown> | null => {
        const row = allCalcResults.find(r => r.calculatorType === type);
        if (!row) return null;
        try { return JSON.parse(row.resultData) as Record<string, unknown>; } catch { return null; }
      };

      const calcOccupantLoad  = getCalc("occupantLoad");
      const calcExitReqs      = getCalc("exitRequirements");
      const calcTravelDist    = getCalc("travelDistance");
      const calcStairDesign   = getCalc("stairDesign");
      const calcGuardHandrail = getCalc("guardHandrail");
      const calcAccessRamp    = getCalc("accessibilityRamp");
      const calcFireSep       = getCalc("fireSeparation");
      const calcFireAlarm     = getCalc("fireAlarm");
      const calcVentilation   = getCalc("ventilationRate");
      const calcBarrierFree   = getCalc("barrierFree");
      const calcPlumbing      = getCalc("plumbingFixture");
      const calcSnowLoad      = getCalc("snowLoad");
      const calcBeamSpan      = getCalc("beamSpan");

      const compliance = (strategy?.strategySummaryJson ?? {}) as Partial<ComplianceOutputs>;
      const occupantRows = (calcPkg?.occupantLoadByGroup ?? []) as OccupantGroupRow[];
      const calcSummary  = (calcPkg?.calculationsSummaryJson ?? {}) as Partial<CalcSummary>;
      const areaByFloor  = (calcPkg?.areaByFloor ?? {}) as Record<string, number>;
      const occupancyGroups = (strategy?.occupancyGroups ?? []) as string[];

      const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const W    = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M    = 20; // margin
      const today = new Date().toLocaleDateString("en-CA");

      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `CodeComply | Generated ${today} | For professional review only`,
          M, pageH - 10,
        );
        doc.text(`Page ${pageNum} of ${totalPages}`, W - M, pageH - 10, { align: "right" });
      };

      // ── Page 1 — Cover Sheet ─────────────────────────────────────────────────
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 45, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("PERMIT PACKAGE", M, 20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("CodeComply — AI-Assisted Code Compliance", M, 30);
      doc.setFontSize(9);
      doc.text(`Generated: ${today}`, M, 39);

      doc.setTextColor(0, 0, 0);
      let y = 60;

      // Project info box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.rect(M, y, W - 2 * M, 55, "FD");
      y += 7;
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text("Project Information", M + 5, y); y += 7;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);

      const zoneLabel = project.zoneCode
        ? project.zoneName
          ? `${project.zoneCode} — ${project.zoneName}`
          : project.zoneCode
        : "—";
      const zoneSource = project.zoneCode && project.zoneConfirmedAt
        ? ` (confirmed ${new Date(project.zoneConfirmedAt).toISOString().slice(0, 10)} from ${
            project.zoneLookupSource === 'geocoded_calgary'
              ? 'City of Calgary Land Use Viewer'
              : project.zoneLookupSource === 'geocoded_edmonton'
              ? 'City of Edmonton Open Data'
              : 'city data'
          })`
        : "";
      const projectLines: [string, string][] = [
        ["Project Name",    project.name],
        ["Address",         project.address ?? "—"],
        ["Zone",            zoneLabel + zoneSource],
        ["Province",        strategy?.province ?? project.province ?? "—"],
        ["Code Edition",    strategy?.codeEdition ?? project.codeEdition ?? "—"],
        ["Construction Type", strategy?.constructionType ?? "—"],
        ["Occupancy Groups",  occupancyGroups.join(", ") || "—"],
        ["Sprinklered",     (strategy?.sprinklered ? 1 : 0) === 1 ? "Yes" : "No"],
      ];
      for (const [label, val] of projectLines) {
        doc.setFont("helvetica", "bold"); doc.text(`${label}:`, M + 5, y);
        doc.setFont("helvetica", "normal"); doc.text(val, M + 55, y);
        y += 6;
      }

      y += 10;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const disclaimer = "Prepared using CodeComply — AI-Assisted Code Compliance. This document provides a preliminary code compliance assessment and does not constitute professional engineering or architectural advice. All results must be reviewed and stamped by a qualified professional (P.Eng or Architect) before submission to the Authority Having Jurisdiction (AHJ).";
      const lines = doc.splitTextToSize(disclaimer, W - 2 * M);
      doc.text(lines, M, y);

      if (pkgReview?.decision === "approved") {
        y += lines.length * 5 + 5;
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(134, 239, 172);
        doc.rect(M, y, W - 2 * M, 12, "FD");
        doc.setTextColor(21, 128, 61);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("PERMIT PACKAGE APPROVED — READY FOR SUBMISSION", M + 5, y + 8);
        doc.setTextColor(0, 0, 0);
      }

      // ── Page 2 — Compliance Matrix ───────────────────────────────────────────
      doc.addPage();

      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Code Compliance Matrix", M, 13);
      doc.setTextColor(0, 0, 0);

      const matrixRows: [string, string][] = [
        ["Building Height — NBC 3.2.2.2",         resultLabel(compliance.heightResult)],
        ["Building Area — NBC 3.2.2.2",            resultLabel(compliance.areaResult)],
        ["Building Storeys — NBC 3.2.2.2",         resultLabel(compliance.storeysResult)],
        ["Occupant Load — NBC 4.1.5.3",            calcPkg ? "CALCULATED" : "—"],
        ["Exit Width — NBC 3.3.1.9",               calcPkg ? `${Number(calcPkg.exitWidthRequiredMm ?? 0)} mm required` : "—"],
        ["Travel Distance — NBC 3.4.2.5",
          calcSummary.travelDistanceFail !== undefined
            ? `${calcSummary.travelDistanceFail === 0 ? "PASS" : "FAIL"} (${calcSummary.travelDistanceFail ?? 0} fail)`
            : "—"],
        ["Sprinkler Requirement",                  strategy?.sprinklered ? "Sprinklered" : "Unsprinklered"],
        ["Fire Resistance — Structure",            compliance.fireRatings?.structure ?? "—"],
        ["Fire Resistance — Floor",               compliance.fireRatings?.floor ?? "—"],
        ["Fire Resistance — Exterior",            compliance.fireRatings?.exterior ?? "—"],
        ["Egress Strategy",                        strategy?.exitCount ? `${strategy.exitCount} exit(s) required` : "—"],
        ["Fire Separation Required",              (strategy?.separationRequired ? 1 : 0) === 1 ? "Yes" : "No"],
      ];

      autoTable(doc, {
        startY: 25,
        head: [["NBC Requirement", "Result"]],
        body: matrixRows,
        theme: "grid",
        headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 50, halign: "center" } },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 1) {
            const v = String(data.cell.raw);
            if (v === "PASS" || v.startsWith("PASS")) {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fontStyle = "bold";
            } else if (v === "FAIL" || v.startsWith("FAIL")) {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        margin: { left: M, right: M },
      });

      // ── Page 3 — Code Strategy Summary ──────────────────────────────────────
      doc.addPage();

      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Code Strategy Summary", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 28;

      if (strategy) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Province",             strategy.province],
            ["Code Edition",         strategy.codeEdition],
            ["Construction Type",    strategy.constructionType],
            ["Sprinklered",          (strategy.sprinklered ? 1 : 0) === 1 ? "Yes" : "No"],
            ["Building Height",      strategy.buildingHeightM ? `${strategy.buildingHeightM} m` : "—"],
            ["Building Area",        strategy.buildingAreaM2  ? `${strategy.buildingAreaM2} m²` : "—"],
            ["Storeys",              strategy.storeys?.toString() ?? "—"],
            ["Occupancy Groups",     occupancyGroups.join(", ") || "—"],
            ["Exit Count",           strategy.exitCount?.toString() ?? "—"],
            ["Fire Separation",      (strategy.separationRequired ? 1 : 0) === 1 ? "Required" : "Not Required"],
            ["Max Storeys (NBC 3.2.2.2)",  compliance.maxStoreys?.toString() ?? "Unlimited"],
            ["Max Height (NBC 3.2.2.2)",   compliance.maxHeightM ? `${compliance.maxHeightM} m` : "Unlimited"],
            ["Max Area (NBC 3.2.2.2)",     compliance.maxAreaM2  ? `${compliance.maxAreaM2} m²` : "Unlimited"],
            ["Travel Distance Limit",      `${compliance.travelDistanceLimitM ?? "—"} m`],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        if (strategy.egressStrategy) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10);
          doc.text("Egress Strategy", M, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);
          const egressLines = doc.splitTextToSize(strategy.egressStrategy, W - 2 * M);
          doc.text(egressLines, M, y);
          doc.setTextColor(0, 0, 0);
          y += egressLines.length * 5 + 5;
        }

        if (strategy.approvedAt) {
          doc.setFillColor(220, 252, 231);
          doc.rect(M, y, W - 2 * M, 10, "F");
          doc.setFont("helvetica", "bold"); doc.setFontSize(9);
          doc.setTextColor(21, 128, 61);
          doc.text(`Code Strategy Approved: ${new Date(strategy.approvedAt).toLocaleDateString("en-CA")}`, M + 5, y + 7);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No code strategy found for this project.", M, y);
        doc.setTextColor(0, 0, 0);
      }

      // ── Page 4 — Calculations Package ───────────────────────────────────────
      doc.addPage();

      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Calculations Package", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 28;

      if (calcPkg) {
        // Occupant Load
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Occupant Load — NBC Table 4.1.5.3", M, y); y += 3;

        autoTable(doc, {
          startY: y,
          head: [["Occupancy Group", "Area (m²)", "Factor (p/m²)", "Persons"]],
          body: [
            ...occupantRows.map(r => [r.group, Number(r.areaSqm).toFixed(2), r.factor.toString(), r.persons.toString()]),
            [
              { content: "TOTAL", styles: { fontStyle: "bold" } },
              { content: Number(calcPkg.totalAreaM2 ?? 0).toFixed(2), styles: { fontStyle: "bold" } },
              "",
              { content: (calcPkg.totalOccupantLoad ?? 0).toString(), styles: { fontStyle: "bold", fillColor: [220, 252, 231] } },
            ],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        // Exit Width
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(147, 197, 253);
        doc.rect(M, y, W - 2 * M, 20, "FD");
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Exit Width — NBC 3.3.1.9", M + 5, y + 7);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text(
          `${calcPkg.totalOccupantLoad ?? 0} persons × 6.1 mm/person = ${Number(calcPkg.exitWidthRequiredMm ?? 0)} mm required`,
          M + 5, y + 14,
        );
        y += 26;

        // Travel Distance
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Travel Distance — NBC 3.4.2.5", M, y); y += 5;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text(
          `Pass: ${calcSummary.travelDistancePass ?? 0}   Fail: ${calcSummary.travelDistanceFail ?? 0}   Unable to evaluate: ${calcSummary.travelDistanceUnable ?? 0}`,
          M, y,
        );
        y += 8;

        // Floor Area Summary
        if (Object.keys(areaByFloor).length > 0) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10);
          doc.text("Floor Area Summary", M, y); y += 3;
          autoTable(doc, {
            startY: y,
            head: [["Floor Level", "Area (m²)"]],
            body: [
              ...Object.entries(areaByFloor).map(([floor, area]) => [floor, Number(area).toFixed(2)]),
              [{ content: "TOTAL", styles: { fontStyle: "bold" } }, { content: Number(calcPkg.totalAreaM2 ?? 0).toFixed(2), styles: { fontStyle: "bold" } }],
            ],
            theme: "grid",
            headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: M, right: M },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
        }

        if (calcPkg.approvedAt) {
          doc.setFillColor(220, 252, 231);
          doc.rect(M, y, W - 2 * M, 10, "F");
          doc.setFont("helvetica", "bold"); doc.setFontSize(9);
          doc.setTextColor(21, 128, 61);
          doc.text(`Calculations Approved: ${new Date(calcPkg.approvedAt).toLocaleDateString("en-CA")}`, M + 5, y + 7);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No calculations package found for this project.", M, y);
        doc.setTextColor(0, 0, 0);
      }

      // ── Page 5 — Occupancy & Construction Limits ────────────────────────────
      doc.addPage();
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Occupancy & Construction Limits", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 28;

      y = addSectionHeader(doc, "Occupant Load — NBC Table 4.1.5.3", y, W, M);
      if (calcOccupantLoad) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Occupant Load", String(calcOccupantLoad.occupantLoad ?? "—")],
            ["Area per Person (m²/person)", String(calcOccupantLoad.areaPerPerson ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No occupant load calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Exit Requirements — NBC 3.3.1.9", y, W, M);
      if (calcExitReqs) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Number of Exits Required", String(calcExitReqs.numExits ?? "—")],
            ["Min Width per Exit (mm)", String(calcExitReqs.minWidthPerExit ?? "—")],
            ["Total Exit Width (mm)", String(calcExitReqs.totalExitWidth ?? "—")],
            ["Reasoning", String(calcExitReqs.reasoning ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No exit requirements calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Travel Distance — NBC 3.4.2.5", y, W, M);
      if (calcTravelDist) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Max Allowed (m)", String(calcTravelDist.maxAllowed ?? "—")],
            ["Actual Distance (m)", String(calcTravelDist.actual ?? "—")],
            ["Compliant", calcTravelDist.compliant === true ? "PASS" : calcTravelDist.compliant === false ? "FAIL" : "—"],
            ["Margin (m)", String(calcTravelDist.margin ?? "—")],
            ["Dead End Limit (m)", String(calcTravelDist.deadEndLimit ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 1) {
              const v = String(data.cell.raw);
              if (v === "PASS") { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = "bold"; }
              else if (v === "FAIL") { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
            }
          },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No travel distance calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      // ── Page 6 — Life Safety ─────────────────────────────────────────────────
      doc.addPage();
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Life Safety", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 28;

      y = addSectionHeader(doc, "Stair Design — NBC 3.4.6", y, W, M);
      if (calcStairDesign) {
        const stairReq = (calcStairDesign.requirements ?? {}) as Record<string, unknown>;
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Riser Height (mm)", String(calcStairDesign.actualRiser ?? "—")],
            ["Max Riser (mm)", String(stairReq.maxRiser ?? "—")],
            ["Tread Depth (mm)", String(calcStairDesign.treadDepth ?? "—")],
            ["Min Tread (mm)", String(stairReq.minTread ?? "—")],
            ["Number of Risers", String(calcStairDesign.numRisers ?? "—")],
            ["Number of Treads", String(calcStairDesign.numTreads ?? "—")],
            ["Total Run (mm)", String(calcStairDesign.totalRun ?? "—")],
            ["Headroom (mm)", String(calcStairDesign.headroom ?? "—")],
            ["Handrail Height (mm)", String(calcStairDesign.handrailHeight ?? "—")],
            ["Compliant", calcStairDesign.compliant === true ? "PASS" : calcStairDesign.compliant === false ? "FAIL" : "—"],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 1) {
              const v = String(data.cell.raw);
              if (v === "PASS") { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = "bold"; }
              else if (v === "FAIL") { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
            }
          },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No stair design calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Guards & Handrails — NBC 3.3.1.17 / 3.3.1.18", y, W, M);
      if (calcGuardHandrail) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Guard Required", calcGuardHandrail.guardRequired === true ? "Yes" : calcGuardHandrail.guardRequired === false ? "No" : "—"],
            ["Min Guard Height (mm)", String(calcGuardHandrail.minGuardHeight ?? "—")],
            ["Max Opening Size (mm)", String(calcGuardHandrail.maxOpeningSize ?? "—")],
            ["Load Requirement", String(calcGuardHandrail.loadRequirement ?? "—")],
            ["Handrail Required", calcGuardHandrail.handrailRequired === true ? "Yes" : calcGuardHandrail.handrailRequired === false ? "No" : "—"],
            ["Handrail Height (mm)", String(calcGuardHandrail.handrailHeight ?? "—")],
            ["Compliant", calcGuardHandrail.compliant === true ? "PASS" : calcGuardHandrail.compliant === false ? "FAIL" : "—"],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 1) {
              const v = String(data.cell.raw);
              if (v === "PASS") { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = "bold"; }
              else if (v === "FAIL") { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
            }
          },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No guard/handrail calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Accessibility Ramp — NBC 3.8.3.4", y, W, M);
      if (calcAccessRamp) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Slope (rise:run)", String(calcAccessRamp.slope ?? "—")],
            ["Min Run (mm)", String(calcAccessRamp.minRun ?? "—")],
            ["Number of Runs", String(calcAccessRamp.numRuns ?? "—")],
            ["Rise per Run (mm)", String(calcAccessRamp.actualRisePerRun ?? "—")],
            ["Run Length per Section (mm)", String(calcAccessRamp.runLengthPerSection ?? "—")],
            ["Number of Landings", String(calcAccessRamp.numLandings ?? "—")],
            ["Total Horizontal Length (mm)", String(calcAccessRamp.totalHorizontal ?? "—")],
            ["Handrail Height (mm)", String(calcAccessRamp.handrailHeight ?? "—")],
            ["Handrail Extension (mm)", String(calcAccessRamp.handrailExtension ?? "—")],
            ["Edge Protection", String(calcAccessRamp.edgeProtection ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No accessibility ramp calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      // ── Page 7 — Fire & Mechanical ───────────────────────────────────────────
      doc.addPage();
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Fire & Mechanical", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 28;

      y = addSectionHeader(doc, "Fire Separation — NBC 3.1.7", y, W, M);
      if (calcFireSep) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Fire Resistance Rating", String(calcFireSep.rating ?? "—")],
            ["Severity", String(calcFireSep.severity ?? "—")],
            ["Description", String(calcFireSep.description ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No fire separation calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Fire Alarm — NBC 3.2.4", y, W, M);
      if (calcFireAlarm) {
        const faReqs = Array.isArray(calcFireAlarm.requirements) ? (calcFireAlarm.requirements as string[]).join("; ") : "—";
        const faNbc  = Array.isArray(calcFireAlarm.nbcReferences) ? (calcFireAlarm.nbcReferences as string[]).join(", ") : "—";
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["System Required", calcFireAlarm.systemRequired === true ? "Yes" : calcFireAlarm.systemRequired === false ? "No" : "—"],
            ["System Type", String(calcFireAlarm.systemType ?? "—")],
            ["Detection Required", calcFireAlarm.detectionRequired === true ? "Yes" : calcFireAlarm.detectionRequired === false ? "No" : "—"],
            ["Voice Communication", calcFireAlarm.voiceCommunication === true ? "Yes" : calcFireAlarm.voiceCommunication === false ? "No" : "—"],
            ["Requirements", faReqs],
            ["NBC References", faNbc],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No fire alarm calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Ventilation — NBC 6.2", y, W, M);
      if (calcVentilation) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Space Description", String(calcVentilation.description ?? "—")],
            ["Volume (m³)", String(calcVentilation.volume ?? "—")],
            ["Occupants", String(calcVentilation.occupants ?? "—")],
            ["Ventilation Rate (L/s)", String(calcVentilation.ventilationRate ?? "—")],
            ["Air Changes per Hour", String(calcVentilation.ach ?? "—")],
            ["Per Person Rate (L/s/person)", String(calcVentilation.perPersonRate ?? "—")],
            ["Per Area Rate (L/s/m²)", String(calcVentilation.perAreaRate ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No ventilation calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      // ── Page 8 — Accessibility & Plumbing ───────────────────────────────────
      doc.addPage();
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Accessibility & Plumbing", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 28;

      y = addSectionHeader(doc, "Barrier-Free Access — NBC 3.8", y, W, M);
      if (calcBarrierFree) {
        const bfAddReqs = Array.isArray(calcBarrierFree.additionalRequirements)
          ? (calcBarrierFree.additionalRequirements as string[]).join("; ")
          : String(calcBarrierFree.additionalRequirements ?? "—");
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Access Required", calcBarrierFree.accessRequired === true ? "Yes" : calcBarrierFree.accessRequired === false ? "No" : "—"],
            ["Min Accessible Washrooms", String(calcBarrierFree.minAccessibleWashrooms ?? "—")],
            ["Min Accessible Parking", String(calcBarrierFree.minAccessibleParking ?? "—")],
            ["Additional Requirements", bfAddReqs],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No barrier-free calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Plumbing Fixtures — NBC 7.4", y, W, M);
      if (calcPlumbing) {
        const bd = (calcPlumbing.breakdown ?? {}) as Record<string, unknown>;
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Toilets", String(bd.toilets ?? "—")],
            ["Sinks", String(bd.sinks ?? "—")],
            ["Showers", String(bd.showers ?? "—")],
            ["Bathtubs", String(bd.bathtubs ?? "—")],
            ["Washing Machines", String(bd.washers ?? "—")],
            ["Dishwashers", String(bd.dishwashers ?? "—")],
            ["Total Fixture Units", String(calcPlumbing.totalFU ?? "—")],
            ["Drain Size", String(calcPlumbing.drainSize ?? "—")],
            ["Vent Size", String(calcPlumbing.ventSize ?? "—")],
            ["Main Supply Size", String(calcPlumbing.mainSupplySize ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No plumbing fixture calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      // ── Page 9 — Structural & Environmental ─────────────────────────────────
      doc.addPage();
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Structural & Environmental", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 28;

      y = addSectionHeader(doc, "Snow Load — NBC 4.1.6", y, W, M);
      if (calcSnowLoad) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Location", String(calcSnowLoad.location ?? "—")],
            ["Ground Snow Load Ss (kPa)", String(calcSnowLoad.Ss ?? "—")],
            ["Importance Factor Is", String(calcSnowLoad.Is ?? "—")],
            ["Slope Factor Cs", String(calcSnowLoad.Cs ?? "—")],
            ["Wind Factor Cw", String(calcSnowLoad.Cw ?? "—")],
            ["Rain Load Sr (kPa)", String(calcSnowLoad.Sr ?? "—")],
            ["Rain Companion Load (kPa)", String(calcSnowLoad.rainLoad ?? "—")],
            ["Design Snow Load (kPa)", String(calcSnowLoad.totalLoad ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No snow load calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      y = addSectionHeader(doc, "Beam Span — NBC Part 9 Span Tables", y, W, M);
      if (calcBeamSpan) {
        autoTable(doc, {
          startY: y,
          head: [["Parameter", "Value"]],
          body: [
            ["Maximum Allowable Span", String(calcBeamSpan.maxSpan ?? "—")],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90, fontStyle: "bold" }, 1: { cellWidth: 80 } },
          margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9); doc.setTextColor(107, 114, 128);
        doc.text("No beam span calculation saved for this project.", M, y);
        doc.setTextColor(0, 0, 0); y += 8;
      }

      // ── Page 10 — Professional Stamp Block ───────────────────────────────────
      doc.addPage();

      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Professional Review & Stamp", M, 13);
      doc.setTextColor(0, 0, 0);
      y = 30;

      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const stampWarning = "This document requires review and stamp by a licensed professional engineer (P.Eng) or registered architect before submission to the Authority Having Jurisdiction (AHJ). Submission without professional review may result in rejection or legal liability.";
      const warnLines = doc.splitTextToSize(stampWarning, W - 2 * M);
      doc.text(warnLines, M, y); y += warnLines.length * 5 + 10;
      doc.setTextColor(0, 0, 0);

      const stampFields: [string, number][] = [
        ["Name (Print)", 50],
        ["Designation (P.Eng / Architect / Other)", 50],
        ["License Number", 50],
        ["Province of Registration", 50],
        ["Date of Review", 50],
      ];

      for (const [label, lineWidth] of stampFields) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text(label, M, y); y += 6;
        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.5);
        doc.line(M, y, M + lineWidth, y); y += 10;
      }

      // Signature line — larger
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("Signature", M, y); y += 8;
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.8);
      doc.line(M, y, M + 80, y); y += 15;

      // Stamp box
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.5);
      doc.rect(M, y, 50, 50);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("Professional Stamp", M + 5, y + 10);
      doc.text("(Affix Here)", M + 5, y + 17);

      // Footers on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      return { pdfBase64: doc.output("datauristring") };
    }),

  // ── generateJSON ─────────────────────────────────────────────────────────────
  generateJSON: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [projectCheck] = await db.select({ id: projects.id, userId: projects.userId }).from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!projectCheck) throw new TRPCError({ code: "NOT_FOUND" });
      if (projectCheck.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "org_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { project, strategy, calcPkg, latestDrawing, pkgReview } = await fetchPackageData(input.projectId, db);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const compliance = (strategy?.strategySummaryJson ?? {}) as Partial<ComplianceOutputs>;
      const calcSummary = (calcPkg?.calculationsSummaryJson ?? {}) as Partial<CalcSummary>;

      const electronicPackage = {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        ruleEngineVersion: "1.0",
        project: {
          name:         project.name,
          address:      project.address ?? null,
          province:     strategy?.province ?? project.province ?? null,
          codeEdition:  strategy?.codeEdition ?? project.codeEdition ?? null,
        },
        occupancy: {
          groups:           strategy?.occupancyGroups ?? [],
          constructionType: strategy?.constructionType ?? null,
          sprinklered:      (strategy?.sprinklered ? 1 : 0) === 1,
          buildingHeightM:  strategy?.buildingHeightM ? Number(strategy.buildingHeightM) : null,
          buildingAreaM2:   strategy?.buildingAreaM2  ? Number(strategy.buildingAreaM2)  : null,
          storeys:          strategy?.storeys ?? null,
        },
        calculations: {
          totalOccupantLoad:    calcPkg?.totalOccupantLoad ?? null,
          exitWidthRequiredMm:  calcPkg?.exitWidthRequiredMm ? Number(calcPkg.exitWidthRequiredMm) : null,
          totalAreaM2:          calcPkg?.totalAreaM2 ? Number(calcPkg.totalAreaM2) : null,
          travelDistancePass:   calcSummary.travelDistancePass ?? null,
          travelDistanceFail:   calcSummary.travelDistanceFail ?? null,
          travelDistanceUnable: calcSummary.travelDistanceUnable ?? null,
          occupantLoadByGroup:  calcPkg?.occupantLoadByGroup ?? [],
        },
        compliance: {
          heightResult:         compliance.heightResult ?? null,
          areaResult:           compliance.areaResult ?? null,
          storeysResult:        compliance.storeysResult ?? null,
          maxStoreys:           compliance.maxStoreys ?? null,
          maxHeightM:           compliance.maxHeightM ?? null,
          maxAreaM2:            compliance.maxAreaM2 ?? null,
          travelDistanceLimitM: compliance.travelDistanceLimitM ?? null,
          fireRatings:          compliance.fireRatings ?? null,
          egressStrategy:       strategy?.egressStrategy ?? null,
          exitCount:            strategy?.exitCount ?? null,
          separationRequired:   (strategy?.separationRequired ? 1 : 0) === 1,
          drawingComplianceScore: latestDrawing?.complianceScore ?? null,
          drawingComplianceLevel: latestDrawing?.complianceLevel ?? null,
        },
        permitPackage: {
          generated:    !!pkgReview,
          approvedAt:   pkgReview?.reviewedAt ?? null,
          submissionStatus:        pkgReview?.submissionStatus ?? "not_submitted",
          permitApplicationNumber: pkgReview?.permitApplicationNumber ?? null,
          reviewingAuthority:      pkgReview?.reviewingAuthority ?? null,
          permitNumber:            pkgReview?.permitNumber ?? null,
        },
        professional: {
          name:          null,
          designation:   null,
          licenseNumber: null,
          signature:     null,
        },
      };

      return { json: electronicPackage };
    }),

  // ── updateSubmissionTracking ──────────────────────────────────────────────────
  updateSubmissionTracking: protectedProcedure
    .input(z.object({
      reviewId:                z.number().int().positive(),
      submittedDate:           z.string().optional(),
      permitApplicationNumber: z.string().max(100).optional(),
      reviewingAuthority:      z.string().max(200).optional(),
      submissionStatus:        z.enum(["not_submitted", "submitted", "under_review", "approved", "rejected"]),
      permitNumber:            z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [review] = await db
        .select({ id: permitReviews.id, projectId: permitReviews.projectId })
        .from(permitReviews)
        .where(eq(permitReviews.id, input.reviewId))
        .limit(1);

      if (!review) throw new TRPCError({ code: "NOT_FOUND" });

      const [project] = await db.select({ userId: projects.userId }).from(projects).where(eq(projects.id, review.projectId)).limit(1);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "org_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(permitReviews)
        .set({
          submittedDate:           input.submittedDate ? new Date(input.submittedDate) : null,
          permitApplicationNumber: input.permitApplicationNumber ?? null,
          reviewingAuthority:      input.reviewingAuthority ?? null,
          submissionStatus:        input.submissionStatus,
          permitNumber:            input.permitNumber ?? null,
        })
        .where(eq(permitReviews.id, input.reviewId));

      return { updated: true };
    }),
});
