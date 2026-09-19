/**
 * Project Router
 *
 * tRPC procedures for project management.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { projectRepository } from '../repositories/ProjectRepository';
import { geocodeAddress as geocodeAddressService } from '../services/geocodingService';
import { getDb } from '../db';
import { projects, drawingAnalyses, complianceSnapshots, users } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { editionForProvince } from '../rules/overlays/index';
import { getDefaultLoadFactor } from '@shared/occupantLoadFactors';
import { getLimits } from '../services/travelDistanceService';
import { Constraints } from '../engine/constraints/index';
import { determineBuildingPart } from '../engine/buildingPartDetermination';
import { assertProjectMemberAccess } from '../services/projectAuthorization';

export const projectRouter = router({
  /**
   * Get all projects for current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return projectRepository.getUserProjects(ctx.user.id);
  }),

  /**
   * Get a single project
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertProjectMemberAccess(ctx.user, input.id);
      return projectRepository.getProjectById(input.id);
    }),

  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255).trim(),
      description: z.string().max(2000).trim().optional(),
      occupancyCode: z.string().max(50).trim().optional(),
      address: z.string().max(200).trim().optional(),
      template: z.string().max(100).trim().optional(),
      buildingType: z.string().max(100).trim().optional(),
      province: z.string().max(5).optional(),
      climateZone: z.string().max(10).optional(),
      seismicZone: z.string().max(20).optional(),
      stepCodeTier: z.string().max(5).optional(),
      jurisdictionDetected: z.boolean().optional(),
      projectCode: z.string().max(50).optional(),
      grossFloorArea: z.number().positive().optional(),
      buildingFootprintJson: z.object({ value: z.number().nonnegative(), confirmed: z.boolean(), source: z.string().min(1).max(100) }).optional(),
      zoningCategory: z.string().max(50).optional(),
      siteConstraints: z.string().max(2000).trim().optional(),
      storeys: z.number().int().positive().optional(),
      totalDwellingUnits: z.number().int().positive().optional(),
      buildingHeight: z.number().positive().optional(),
      constructionType: z.string().max(50).optional(),
      sprinklersRequired: z.boolean().optional(),
      part3Determination: z.string().max(100).optional(),
      codeEdition: z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const [userRow] = await db.select({ orgId: users.orgId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return projectRepository.createProject({
        userId: ctx.user.id,
        orgId: userRow?.orgId ?? null,
        ...input,
      });
    }),

  /**
   * Update a project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).trim().optional(),
        description: z.string().max(2000).trim().optional(),
        occupancyCode: z.string().max(50).trim().optional(),
        address: z.string().max(200).trim().optional(),
        template: z.string().max(100).trim().optional(),
        buildingType: z.string().max(100).trim().optional(),
        province: z.string().max(5).optional(),
        climateZone: z.string().max(10).optional(),
        seismicZone: z.string().max(20).optional(),
        stepCodeTier: z.string().max(5).optional(),
        jurisdictionDetected: z.boolean().optional(),
        projectCode: z.string().max(50).optional(),
        grossFloorArea: z.number().positive().optional(),
        buildingFootprintJson: z.object({ value: z.number().nonnegative(), confirmed: z.boolean(), source: z.string().min(1).max(100) }).optional(),
        bedroomCount: z.number().int().nonnegative().optional(),
        totalDwellingUnits: z.number().int().positive().optional(),
        zoningCategory: z.string().max(50).optional(),
        siteConstraints: z.string().max(2000).trim().optional(),
        storeys: z.number().int().positive().optional(),
        buildingHeight: z.number().positive().optional(),
        constructionType: z.string().max(50).optional(),
        sprinklersRequired: z.boolean().optional(),
        part3Determination: z.string().max(100).optional(),
        codeEdition: z.string().max(20).optional(),
        stackSeparationsJson: z.array(z.object({
          from: z.string(),
          to: z.string(),
          frr: z.string(),
          hours: z.number(),
          nbcRef: z.string(),
        })).optional(),
        stackWingsJson: z.array(z.object({
          id: z.string(),
          label: z.string(),
          source: z.string().max(100).optional(),
          floors: z.array(z.object({
            zones: z.array(z.object({
              code: z.string(),
              area_m2: z.number(),
            })),
          })),
        })).optional(),
        stackConfirmedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return projectRepository.updateProject({
        userId: ctx.user.id,
        ...input,
      });
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return projectRepository.deleteProject(input.id, ctx.user.id);
    }),

  /**
   * Get project statistics
   */
  stats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return projectRepository.getProjectStats(input.id, ctx.user.id);
    }),

  /**
   * Geocode a Canadian address and optionally persist results to a project.
   */
  geocodeAddress: protectedProcedure
    .input(z.object({
      address: z.string().min(5).max(500),
      projectId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await geocodeAddressService(input.address);

      if (input.projectId && 'latitude' in result) {
        const db = await getDb();
        if (db) {
          const [project] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));

          if (project) {
            await db.update(projects).set({
              address: result.address,
              parcelLat: result.latitude.toString(),
              parcelLng: result.longitude.toString(),
              province: result.province,
              municipality: result.municipality,
              jurisdictionSource: 'geocoded',
              geocodedAt: new Date(),
            }).where(eq(projects.id, input.projectId));
          }
        }
      }

      return result;
    }),

  /**
   * Get the resolved jurisdiction for a project (geocoded or manual).
   */
  getProjectJurisdiction: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const [project] = await db
        .select({
          address: projects.address,
          latitude: projects.parcelLat,
          longitude: projects.parcelLng,
          province: projects.province,
          municipality: projects.municipality,
          jurisdictionSource: projects.jurisdictionSource,
          geocodedAt: projects.geocodedAt,
        })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));

      if (!project) return null;

      return {
        ...project,
        codeEdition: editionForProvince(project.province ?? ''),
      };
    }),

  /**
   * Generate a pre-design compliance snapshot (Project Brief).
   * Chains occupant load → exit count → travel distance → exit width →
   * sprinkler check → accessibility triggers from project inputs.
   * Returns null sections where inputs are missing rather than erroring.
   */
  generateBrief: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');

      const [project] = await db
        .select({
          id: projects.id,
          occupancyCode: projects.occupancyCode,
          grossFloorArea: projects.grossFloorArea,
          buildingFootprintJson: projects.buildingFootprintJson,
          bedroomCount: projects.bedroomCount,
          totalDwellingUnits: projects.totalDwellingUnits,
          storeys: projects.storeys,
          province: projects.province,
          sprinklersRequired: projects.sprinklersRequired,
          constructionType: projects.constructionType,
          userId: projects.userId,
          status: projects.status,
          buildingType: projects.buildingType,
        })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));

      if (!project) throw new Error('Project not found');
      const [latestAnalysis] = await db
        .select({ analysisStatus: drawingAnalyses.analysisStatus })
        .from(drawingAnalyses)
        .where(and(eq(drawingAnalyses.projectId, input.projectId), eq(drawingAnalyses.userId, ctx.user.id)))
        .orderBy(desc(drawingAnalyses.id))
        .limit(1);
      const [latestSnapshot] = await db
        .select({ complianceStatus: complianceSnapshots.complianceStatus })
        .from(complianceSnapshots)
        .where(and(eq(complianceSnapshots.projectId, input.projectId), eq(complianceSnapshots.userId, ctx.user.id)))
        .orderBy(desc(complianceSnapshots.createdAt))
        .limit(1);

      const occupancyGroup = project.occupancyCode ?? null;
      const grossFloorAreaM2 = project.grossFloorArea ? parseFloat(project.grossFloorArea) : null;
      const storeys = project.storeys ?? null;
      const footprintFact = project.buildingFootprintJson as { value?: number } | null;
      const footprintM2 = typeof footprintFact?.value === 'number' ? footprintFact.value : null;
      const determination = determineBuildingPart({ footprintM2, storeys, occupancyGroup });
      const province = project.province ?? null;
      const sprinkleredInput = project.sprinklersRequired != null
        ? project.sprinklersRequired === 1
        : null;

      // Completeness: count how many of the 5 key inputs are set
      const inputsSet = [occupancyGroup, grossFloorAreaM2, storeys, province, sprinkleredInput]
        .filter(v => v !== null && v !== undefined).length;
      const completeness = Math.round((inputsSet / 5) * 100);

      // ── Section 1: Occupant Load ────────────────────────────────────────────
      let occupantLoadSection: {
        value: number | null;
        factor: number | string | null;
        useType: string;
        citation: string;
        note: string | null;
        isDefault: boolean;
      } | null = null;

      let occupantLoad: number | null = null;

      // Group C: dwelling units use 2 persons/bedroom
      // (NBC 3.1.17.1 Note 2), not area-based factor
      if (occupancyGroup?.startsWith('C')) {
        if (project.bedroomCount != null && project.bedroomCount > 0) {
          occupantLoad = project.bedroomCount * 2;
          occupantLoadSection = {
            value: occupantLoad,
            factor: '2 persons/bedroom',
            useType: 'Dwelling Units',
            citation: 'NBC 3.1.17.1 Note (2)',
            isDefault: false,
            note: null,
          };
        } else {
          // bedroomCount not yet entered — prompt user
          occupantLoad = null;
          occupantLoadSection = {
            value: occupantLoad,
            factor: null,
            useType: 'Dwelling Units',
            citation: 'NBC 3.1.17.1 Note (2)',
            isDefault: true,
            note: 'Enter bedroom count to calculate — dwelling units use 2 persons per bedroom',
          };
        }
      } else if (occupancyGroup) {
        const spec = getDefaultLoadFactor(occupancyGroup);
        occupantLoad = grossFloorAreaM2 !== null
          ? Math.ceil(grossFloorAreaM2 / spec.areaPerPerson)
          : null;
        occupantLoadSection = {
          value: occupantLoad,
          factor: spec.areaPerPerson,
          useType: spec.useType,
          citation: 'NBC 2020 Table 3.1.17.1',
          note: spec.note,
          isDefault: true,
        };
      }

      // ── Section 2: Exit Count ───────────────────────────────────────────────
      let exitCountSection: {
        required: number | null;
        singleExitException: boolean;
        citation: string;
      } | null = null;

      if (occupantLoad !== null) {
        const ec = Constraints.egress.exit_count;
        let required: number;
        let citation: string;
        if (occupantLoad <= ec.threshold_low.value) {
          required = ec.threshold_low.exits;
          citation = ec.threshold_low.ref;
        } else if (occupantLoad <= ec.threshold_mid.value) {
          required = ec.threshold_mid.exits;
          citation = ec.threshold_mid.ref;
        } else {
          required = ec.threshold_high.exits;
          citation = ec.threshold_high.ref;
        }
        const singleExitException =
          occupantLoad <= ec.threshold_low.value &&
          grossFloorAreaM2 !== null &&
          grossFloorAreaM2 <= 200;
        exitCountSection = { required, singleExitException, citation };
      }

      // ── Section 3: Travel Distance ─────────────────────────────────────────
      const { limits: tdLimits } = getLimits(occupancyGroup);
      const sprinkleredBool = sprinkleredInput ?? false;
      const travelDistanceSection = {
        unsprinklered: tdLimits.unsprinklered,
        sprinklered: tdLimits.sprinklered,
        applicable: sprinkleredBool ? tdLimits.sprinklered : tdLimits.unsprinklered,
        citation: 'NBC 3.4.2.5',
      };

      // ── Section 4: Exit Width ──────────────────────────────────────────────
      let exitWidthSection: {
        totalMm: number | null;
        perDoorMm: number;
        factor: number;
        citations: string[];
      } | null = null;

      if (occupantLoad !== null) {
        const isGroupB = (occupancyGroup ?? '').toUpperCase().startsWith('B');
        const widthFactor = isGroupB ? 18.4 : 6.1;
        exitWidthSection = {
          totalMm: Math.ceil(occupantLoad * widthFactor),
          perDoorMm: Constraints.egress.exit_width.minimum.value,
          factor: widthFactor,
          citations: [
            'NBC 3.4.3.2',
            Constraints.egress.exit_width.minimum.ref,
          ],
        };
      }

      // ── Section 5: Sprinkler Requirement ───────────────────────────────────
      // Mirrors occupancyAdvisorRouter logic for consistency:
      // - Group A or B → required
      // - F-1 → required
      // - Part 3 building (storeys > 3, or Group C area > 600, or others > 5000) AND
      //   (area > 1200 OR storeys > 3) → required
      // - storeys > 6 → required (high-rise)
      const code = (occupancyGroup ?? '').toUpperCase();
      const area = grossFloorAreaM2 ?? 0;
      const storeysNum = storeys ?? 0;

      const part3Required = determination.determination === 'Part 3';

      let codeRequiredSprinklers = false;
      let sprinklerCitation = '';
      if (code.startsWith('A') || code.startsWith('B')) {
        codeRequiredSprinklers = true;
        sprinklerCitation = 'NBC 3.2.5.2.(1)';
      } else if (code === 'F-1') {
        codeRequiredSprinklers = true;
        sprinklerCitation = 'NBC 3.2.5.2.(1)';
      } else if (part3Required && (area > 1200 || storeysNum > 3)) {
        codeRequiredSprinklers = true;
        sprinklerCitation = 'NBC 3.2.5.10';
      } else if (storeysNum > 6) {
        codeRequiredSprinklers = true;
        sprinklerCitation = 'NBC 3.2.6';
      }

      const sprinklerSection = {
        codeRequired: occupancyGroup !== null ? codeRequiredSprinklers : null,
        userSelected: sprinkleredInput,
        citation: sprinklerCitation || 'NBC 3.2.5',
      };

      // ── Section 6: Accessibility Triggers ──────────────────────────────────
      // Elevator: grossFloorArea > 600 AND storeys > 1 (NBC 3.8.2.4)
      // Accessible washroom: Groups A, D, E — public-facing (NBC 3.8.2.8)
      // Barrier-free path: required when building has an accessible storey (NBC 3.8.2.3)
      const elevatorRequired =
        grossFloorAreaM2 !== null && storeys !== null
          ? grossFloorAreaM2 > 600 && storeys > 1
          : null;

      const accessibleWashroomGroups = ['A', 'A-1', 'A-2', 'A-3', 'A-4', 'D', 'E'];
      const accessibleWashroom = occupancyGroup
        ? accessibleWashroomGroups.some(g =>
            code === g || code.startsWith(g + '-')
          )
        : null;

      const barrierFreePath = occupancyGroup
        ? !['F-1', 'F-2', 'F-3'].includes(code)
        : null;

      const accessibilitySection = {
        elevatorRequired,
        accessibleWashroom,
        barrierFreePath,
        citations: [
          'NBC 3.8.2.3',
          'NBC 3.8.2.4',
          'NBC 3.8.2.8',
        ],
      };

      // ── Section 7: Construction Type ───────────────────────────────────────
      const constructionTypeSection = {
        permitted: project.constructionType
          ? [project.constructionType]
          : part3Required
            ? ['Non-combustible (verify NBC Table 3.2.2.7)']
            : ['Combustible may be acceptable (verify NBC Table 3.2.2.7)'],
        citation: 'NBC Table 3.2.2.7',
      };

      return {
        inputs: {
          occupancyGroup,
          grossFloorAreaM2,
          buildingFootprintM2: footprintM2,
          partDetermination: determination,
          storeys,
          province,
          sprinklered: sprinkleredInput,
          totalDwellingUnits: project.totalDwellingUnits,
          buildingFootprintJson: project.buildingFootprintJson,
          status: project.status,
          buildingType: project.buildingType,
          analysisStatus: latestAnalysis?.analysisStatus ?? null,
          latestSnapshotStatus: latestSnapshot?.complianceStatus ?? null,
        },
        sections: {
          occupantLoad: occupantLoadSection,
          exitCount: exitCountSection,
          travelDistance: travelDistanceSection,
          exitWidth: exitWidthSection,
          sprinklers: sprinklerSection,
          accessibility: accessibilitySection,
          constructionType: constructionTypeSection,
        },
        completeness,
      };
    }),
});
