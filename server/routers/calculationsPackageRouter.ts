import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  calculationsPackages,
  codeStrategies,
  projects,
  drawingAnalyses,
  drawingPages,
  detectedRooms,
  detectedFeatures,
  permitReviews,
} from "../../drizzle/schema";
import { calculateTravelDistances } from "../services/travelDistanceService";
import type { DetectedRoomInput } from "../services/travelDistanceService";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── NBC Table 4.1.5.3 — Occupant load factors (persons per m²) ───────────────
const OCCUPANT_LOAD_FACTORS: Record<string, number> = {
  "A-1": 0.67,
  "A-2": 1.0,
  "A-3": 0.5,
  "A-4": 0.67,
  "B-1": 0.1,
  "B-2": 0.1,
  "B-3": 0.1,
  C:     0.04,
  D:     0.107,
  E:     0.27,
  "F-1": 0.033,
  "F-2": 0.033,
  "F-3": 0.033,
};

function occupantLoadFactor(occupancyGroup: string | null): number | null {
  if (!occupancyGroup) return null;
  // Try exact match first, then first-letter group
  if (OCCUPANT_LOAD_FACTORS[occupancyGroup] !== undefined) return OCCUPANT_LOAD_FACTORS[occupancyGroup];
  const letter = occupancyGroup.charAt(0).toUpperCase();
  return OCCUPANT_LOAD_FACTORS[letter] ?? null;
}

interface OccupantGroupRow {
  group: string;
  areaSqm: number;
  persons: number;
  factor: number;
}

interface CalculationsSummary {
  totalOccupantLoad: number;
  exitWidthRequiredMm: number;
  occupantLoadByGroup: OccupantGroupRow[];
  travelDistancePass: number;
  travelDistanceFail: number;
  travelDistanceUnable: number;
  areaByFloor: Record<string, number>;
  totalAreaM2: number;
  codeStrategyStatus: string | null;
  nbcReferences: string[];
}

function buildSummary(
  occupantRows: OccupantGroupRow[],
  totalOccupants: number,
  exitWidthMm: number,
  travelResults: ReturnType<typeof calculateTravelDistances>,
  areaByFloor: Record<string, number>,
  totalArea: number,
  codeStrategyStatus: string | null,
): CalculationsSummary {
  const pass   = travelResults.filter(r => r.result === "pass").length;
  const fail   = travelResults.filter(r => r.result === "fail").length;
  const unable = travelResults.filter(r => r.result === "unable_to_evaluate").length;
  return {
    totalOccupantLoad: totalOccupants,
    exitWidthRequiredMm: exitWidthMm,
    occupantLoadByGroup: occupantRows,
    travelDistancePass: pass,
    travelDistanceFail: fail,
    travelDistanceUnable: unable,
    areaByFloor,
    totalAreaM2: totalArea,
    codeStrategyStatus,
    nbcReferences: [
      "NBC 4.1.5.3 — Occupant Load",
      "NBC 3.3.1.9 — Exit Width",
      "NBC 3.4.2.5 — Travel Distance",
    ],
  };
}

export const calculationsPackageRouter = router({

  // ── generate ────────────────────────────────────────────────────────────────
  generate: protectedProcedure
    .input(z.object({
      projectId:   z.number().int().positive(),
      province:    z.string().max(5),
      codeEdition: z.string().max(20),
      sprinklered: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Verify project ownership
      const project = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!project[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      if (project[0].userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "org_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Latest drawing analysis
      const [latestAnalysis] = await db
        .select()
        .from(drawingAnalyses)
        .where(eq(drawingAnalyses.projectId, input.projectId))
        .orderBy(desc(drawingAnalyses.createdAt))
        .limit(1);

      let travelResults: ReturnType<typeof calculateTravelDistances> = [];
      let drawingAnalysisId: number | undefined;

      let pages: (typeof drawingPages.$inferSelect)[] = [];

      if (latestAnalysis) {
        drawingAnalysisId = latestAnalysis.id;

        pages = await db
          .select()
          .from(drawingPages)
          .where(eq(drawingPages.drawingId, latestAnalysis.id));

        // Rooms + features across all pages
        const allRoomInputs: DetectedRoomInput[] = [];
        for (const page of pages) {
          const rooms = await db
            .select()
            .from(detectedRooms)
            .where(eq(detectedRooms.pageId, page.id));

          for (const room of rooms) {
            const features = await db
              .select({ featureType: detectedFeatures.featureType })
              .from(detectedFeatures)
              .where(eq(detectedFeatures.roomId, room.id));

            let bbox = null;
            try {
              bbox = room.boundingBoxJson ? JSON.parse(room.boundingBoxJson as string) : null;
            } catch { bbox = null; }

            allRoomInputs.push({
              id: room.id,
              roomLabel: room.roomLabel ?? "",
              boundingBox: bbox,
              occupancyGroup: room.occupancyGroup ?? null,
              features,
            });
          }

          // Use calibration from first page that has it
          if (pages.indexOf(page) === 0) {
            const pixelsPerMm = page.calibrationScale ? Number(page.calibrationScale) : null;
            travelResults = calculateTravelDistances(allRoomInputs, pixelsPerMm, input.sprinklered);
          }
        }
      }

      // Latest code strategy
      const [latestStrategy] = await db
        .select()
        .from(codeStrategies)
        .where(eq(codeStrategies.projectId, input.projectId))
        .orderBy(desc(codeStrategies.createdAt))
        .limit(1);

      const codeStrategyId    = latestStrategy?.id;
      const codeStrategyStatus = (latestStrategy?.strategySummaryJson as any)?.overallCompliance ?? null;

      // Occupant load calculation from detected rooms
      const occupantByGroup: Record<string, { area: number; persons: number; factor: number }> = {};
      let totalArea    = 0;
      const areaByFloor: Record<string, number> = {};

      const allRooms = pages.length > 0
        ? await db
            .select()
            .from(detectedRooms)
            .where(inArray(detectedRooms.pageId, pages.map(p => p.id)))
        : [];

      for (const room of allRooms) {
        const area = room.areaSqm ? Number(room.areaSqm) : 0;
        if (area <= 0) continue;

        totalArea += area;
        const floor = room.floorLevel ?? "Unknown";
        areaByFloor[floor] = (areaByFloor[floor] ?? 0) + area;

        const group  = room.occupancyGroup ?? "Unknown";
        const factor = occupantLoadFactor(room.occupancyGroup);
        if (factor !== null) {
          if (!occupantByGroup[group]) occupantByGroup[group] = { area: 0, persons: 0, factor };
          occupantByGroup[group].area    += area;
          occupantByGroup[group].persons += area * factor;
        }
      }

      const occupantRows: OccupantGroupRow[] = Object.entries(occupantByGroup).map(([group, v]) => ({
        group,
        areaSqm:  Math.round(v.area * 100) / 100,
        persons:  Math.ceil(v.persons),
        factor:   v.factor,
      }));

      const totalOccupants     = occupantRows.reduce((s, r) => s + r.persons, 0);
      const exitWidthRequiredMm = Math.ceil(totalOccupants * 6.1);

      const summary = buildSummary(
        occupantRows,
        totalOccupants,
        exitWidthRequiredMm,
        travelResults,
        areaByFloor,
        Math.round(totalArea * 100) / 100,
        codeStrategyStatus,
      );

      // Upsert: supersede any existing draft
      const [existing] = await db
        .select({ id: calculationsPackages.id })
        .from(calculationsPackages)
        .where(
          and(
            eq(calculationsPackages.projectId, input.projectId),
            eq(calculationsPackages.status, "draft"),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(calculationsPackages)
          .set({ status: "superseded" })
          .where(eq(calculationsPackages.id, existing.id));
      }

      await db.insert(calculationsPackages).values({
        projectId:               input.projectId,
        orgId:                   ctx.user.orgId ?? null,
        createdBy:               ctx.user.id,
        drawingAnalysisId:       drawingAnalysisId ?? null,
        codeStrategyId:          codeStrategyId ?? null,
        province:                input.province,
        codeEdition:             input.codeEdition,
        sprinklered:             input.sprinklered ? 1 : 0,
        occupantLoadByGroup:     occupantRows,
        totalOccupantLoad:       totalOccupants,
        exitWidthRequiredMm:     exitWidthRequiredMm.toString(),
        travelDistanceResults:   travelResults,
        areaByFloor,
        totalAreaM2:             totalArea.toString(),
        nbcTableRef:             "NBC 4.1.5.3",
        calculationsSummaryJson: summary,
      });

      const [created] = await db
        .select()
        .from(calculationsPackages)
        .where(eq(calculationsPackages.projectId, input.projectId))
        .orderBy(desc(calculationsPackages.createdAt))
        .limit(1);

      return created;
    }),

  // ── get ─────────────────────────────────────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const project = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!project[0]) throw new TRPCError({ code: "NOT_FOUND" });
      if (project[0].userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "org_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [pkg] = await db
        .select()
        .from(calculationsPackages)
        .where(eq(calculationsPackages.projectId, input.projectId))
        .orderBy(desc(calculationsPackages.createdAt))
        .limit(1);

      return pkg ?? null;
    }),

  // ── approve ──────────────────────────────────────────────────────────────────
  approve: protectedProcedure
    .input(z.object({
      packageId: z.number().int().positive(),
      notes:     z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "org_admin" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only org admins may approve calculations packages" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [pkg] = await db
        .select()
        .from(calculationsPackages)
        .where(eq(calculationsPackages.id, input.packageId))
        .limit(1);

      if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });
      if ((pkg.status ?? "draft") === "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "Already approved" });

      await db
        .update(calculationsPackages)
        .set({ approvedBy: ctx.user.id, approvedAt: new Date(), status: "approved" })
        .where(eq(calculationsPackages.id, input.packageId));

      if (pkg.orgId) {
        await db.insert(permitReviews).values({
          projectId:  pkg.projectId,
          orgId:      pkg.orgId,
          reviewedBy: ctx.user.id,
          reviewType: "calculations",
          decision:   "approved",
          notes:      input.notes ?? null,
        });
      }

      return { approved: true };
    }),

  // ── generatePDF ──────────────────────────────────────────────────────────────
  generatePDF: protectedProcedure
    .input(z.object({ packageId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [pkg] = await db
        .select()
        .from(calculationsPackages)
        .where(eq(calculationsPackages.id, input.packageId))
        .limit(1);

      if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify access
      const [project] = await db.select().from(projects).where(eq(projects.id, pkg.projectId)).limit(1);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "org_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const summary = pkg.calculationsSummaryJson as CalculationsSummary | null;
      const occupantRows = (pkg.occupantLoadByGroup as OccupantGroupRow[] | null) ?? [];
      const travelResults = (pkg.travelDistanceResults as ReturnType<typeof calculateTravelDistances> | null) ?? [];
      const areaByFloor   = (pkg.areaByFloor as Record<string, number> | null) ?? {};

      // ── Build PDF ────────────────────────────────────────────────────────────
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const W = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const MARGIN = 20;

      // Header banner
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, W, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CALCULATIONS PACKAGE", MARGIN, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`NBC ${pkg.codeEdition} | ${pkg.province} | ${pkg.sprinklered ? "Sprinklered" : "Unsprinklered"}`, MARGIN, 20);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-CA")}`, W - MARGIN, 20, { align: "right" });

      // Project info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Project Information", MARGIN, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Project: ${project.name ?? `#${project.id}`}`, MARGIN, 48);
      doc.text(`Status: ${(pkg.status ?? "draft").toUpperCase()}`, MARGIN, 54);
      if (pkg.approvedAt) {
        doc.text(`Approved: ${new Date(pkg.approvedAt).toLocaleDateString("en-CA")}`, MARGIN + 80, 54);
      }

      let y = 65;

      // Section 1 — Occupant Load (NBC 4.1.5.3)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. Occupant Load — NBC Table 4.1.5.3", MARGIN, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        head: [["Occupancy Group", "Area (m²)", "Factor (p/m²)", "Persons"]],
        body: [
          ...occupantRows.map(r => [r.group, r.areaSqm.toFixed(2), r.factor.toString(), r.persons.toString()]),
          [{ content: "TOTAL", styles: { fontStyle: "bold" } }, { content: (summary?.totalAreaM2 ?? 0).toFixed(2), styles: { fontStyle: "bold" } }, "", { content: (pkg.totalOccupantLoad ?? 0).toString(), styles: { fontStyle: "bold", fillColor: [220, 252, 231] } }],
        ],
        theme: "grid",
        headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: MARGIN, right: MARGIN },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Section 2 — Exit Width (NBC 3.3.1.9)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("2. Required Exit Width — NBC 3.3.1.9", MARGIN, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const exitWidthMm = pkg.exitWidthRequiredMm ? Number(pkg.exitWidthRequiredMm) : 0;
      doc.text(`Total occupant load: ${pkg.totalOccupantLoad ?? 0} persons`, MARGIN, y);
      y += 5;
      doc.text(`Required width per exit leaf: 6.1 mm/person × ${pkg.totalOccupantLoad ?? 0} = ${exitWidthMm} mm`, MARGIN, y);
      y += 5;
      doc.text(`Minimum door clear width: 850 mm (NBC 3.3.1.9(3))`, MARGIN, y);
      y += 10;

      // Section 3 — Travel Distance (NBC 3.4.2.5)
      if (travelResults.length > 0) {
        if (y + 40 > pageH - 30) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("3. Travel Distance — NBC 3.4.2.5", MARGIN, y);
        y += 3;

        const tdRows = travelResults
          .filter(r => r.result !== "not_applicable")
          .slice(0, 30)
          .map(r => [
            r.roomLabel,
            r.distanceM !== null ? r.distanceM.toFixed(1) + " m" : "—",
            r.limit + " m",
            r.result.toUpperCase(),
          ]);

        autoTable(doc, {
          startY: y,
          head: [["Room", "Distance", "Limit", "Result"]],
          body: tdRows,
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 3) {
              if (data.cell.raw === "PASS") data.cell.styles.textColor = [22, 163, 74];
              else if (data.cell.raw === "FAIL") data.cell.styles.textColor = [220, 38, 38];
            }
          },
          margin: { left: MARGIN, right: MARGIN },
        });

        y = (doc as any).lastAutoTable.finalY + 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const pass   = summary?.travelDistancePass   ?? 0;
        const fail   = summary?.travelDistanceFail   ?? 0;
        const unable = summary?.travelDistanceUnable ?? 0;
        doc.text(`Pass: ${pass}   Fail: ${fail}   Unable to evaluate: ${unable}`, MARGIN, y);
        y += 10;
      }

      // Section 4 — Area by Floor
      if (Object.keys(areaByFloor).length > 0) {
        if (y + 30 > pageH - 30) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("4. Floor Area Summary", MARGIN, y);
        y += 3;
        autoTable(doc, {
          startY: y,
          head: [["Floor Level", "Area (m²)"]],
          body: [
            ...Object.entries(areaByFloor).map(([floor, area]) => [floor, area.toFixed(2)]),
            [{ content: "TOTAL", styles: { fontStyle: "bold" } }, { content: (summary?.totalAreaM2 ?? 0).toFixed(2), styles: { fontStyle: "bold" } }],
          ],
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: MARGIN, right: MARGIN },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Approval box
      if (y + 35 > pageH - 30) { doc.addPage(); y = 20; }
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.5);
      doc.rect(MARGIN, y, W - 2 * MARGIN, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      if ((pkg.status ?? "draft") === "approved" && pkg.approvedAt) {
        doc.setTextColor(22, 163, 74);
        doc.text("APPROVED", MARGIN + 5, y + 8);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Approved: ${new Date(pkg.approvedAt).toLocaleDateString("en-CA")}`, MARGIN + 5, y + 16);
        doc.text("Reviewer signature: ________________________", MARGIN + 5, y + 24);
      } else {
        doc.setTextColor(180, 83, 9);
        doc.text("DRAFT — NOT FOR PERMIT SUBMISSION", MARGIN + 5, y + 10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("This document requires review and approval before submission.", MARGIN + 5, y + 18);
      }

      // Footer on every page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          "FOR PROFESSIONAL USE ONLY — Results must be reviewed by a qualified professional before permit submission.",
          MARGIN, pageH - 10,
        );
        doc.text(`Page ${i} of ${totalPages}`, W - MARGIN, pageH - 10, { align: "right" });
      }

      const pdfBase64 = doc.output("datauristring");
      return { pdfBase64, packageId: pkg.id };
    }),
});
