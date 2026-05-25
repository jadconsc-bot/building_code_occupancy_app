import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { callAnthropicVision } from './services/anthropicVisionService';
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { feedbacks, projects, projectCalculatorResults, projectChecklistItems, complianceSnapshots, auditLog } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure } from "./_core/trpc";
import { complianceRouter } from "./complianceRouter";
import { projectRouter } from "./routers/projectRouter";
import { subscriptionRouter } from "./routers/subscriptionRouter";
import { ruleManagementRouter } from "./ruleManagementRouter";
import { calculationsRouter } from "./calculationsRouter";
import { consultantRouter } from "./consultantRouter";
import { monetizationRouter } from "./monetizationRouter";
import { clientsRouter, projectMembersRouter, subscriptionsRouter, usageMetricsRouter, sharingRouter, verificationRouter, calculationVersioningRouter } from "./routers/phase2to5";
import { compliancePathwayRouter } from "./compliancePathwayRouter";
import { drawingAnalysisRouter } from "./routers/drawingAnalysisRouter";
import { stepCodeRouter } from "./routers/stepCodeRouter";
import { jurisdictionRouter } from "./routers/jurisdictionRouter";
import { reportRouter } from "./routers/reportRouter";
import { occupancyAdvisorRouter } from "./routers/occupancyAdvisorRouter";
import { complianceMonitorRouter } from "./routers/complianceMonitorRouter";
import { organizationRouter } from "./routers/organizationRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  compliance: complianceRouter,
  projects: projectRouter,
  subscriptions: subscriptionRouter,
  ruleManagement: ruleManagementRouter,
  calculations: calculationsRouter,
  consultant: consultantRouter,
  monetization: monetizationRouter,
  clients: clientsRouter,
  projectMembers: projectMembersRouter,
  subscriptionPlans: subscriptionsRouter,
  usageMetrics: usageMetricsRouter,
  sharing: sharingRouter,
  verification: verificationRouter,
  calculationVersioning: calculationVersioningRouter,
  compliancePathway: compliancePathwayRouter,
  drawingAnalysis: drawingAnalysisRouter,
  stepCode: stepCodeRouter,
  jurisdiction: jurisdictionRouter,
  report: reportRouter,
  occupancyAdvisor: occupancyAdvisorRouter,
  complianceMonitor: complianceMonitorRouter,
  organization: organizationRouter,
  auth: router({
    me: protectedProcedure.query(opts => opts.ctx.user),
    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Plan Analysis
  analyzePlan: publicProcedure
    .input(
      z.object({
        imageData: z.string(),
        fileName: z.string(),
        occupancyType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { imageData, fileName, occupancyType } = input;

      // Call LLM with vision to analyze the plan
      const prompt = `You are an expert building code inspector analyzing architectural plans for NBC 2025 (National Building Code of Canada 2025) compliance.

Analyze this architectural plan for occupancy type "${occupancyType}" (Residential) and identify code infractions.

For each infraction found, provide:
1. Severity (critical, warning, or info)
2. NBC code reference (e.g., "NBC 3.4.6.5")
3. Title (brief description)
4. Detailed description of the issue
5. Location on the plan (be specific)
6. Recommendation to fix
7. Approximate x,y coordinates as percentages (0-100) if visible on plan

Focus on:
- Stair dimensions (rise, run, width)
- Guard and handrail heights
- Door widths and clearances
- Window sizes and egress requirements
- Room dimensions and ceiling heights
- Fire separations
- Accessibility requirements

Return ONLY a valid JSON array of infractions in this exact format:
[
  {
    "id": "unique-id",
    "severity": "critical",
    "code": "NBC 3.4.6.5",
    "title": "Stair riser exceeds maximum",
    "description": "Stair riser measures 210mm, exceeding NBC maximum of 200mm",
    "location": "Main staircase, first floor",
    "recommendation": "Reduce riser height to 200mm or less by adding one additional step",
    "x": 45,
    "y": 60
  }
]

If no infractions are found, return an empty array: []`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: imageData,
                  },
                },
              ],
            },
          ],
          maxTokens: 4000,
        });

        const content = response.choices[0]?.message?.content || "[]";
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = typeof content === 'string' ? content.trim() : JSON.stringify(content);
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/```\n?/g, "");
        }
        
        const infractions = JSON.parse(jsonStr);

        return {
          success: true,
          infractions,
          fileName,
        };
      } catch (error) {
        console.error("Plan analysis error:", error);
        return {
          success: false,
          infractions: [],
          error: "Failed to analyze plan. Please try again.",
        };
      }
    }),

  analyzeSpace: publicProcedure
    .input(z.object({
      imageBase64: z.string(),
      mimeType: z.string(),
      climateZone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { imageBase64, mimeType, climateZone } = input;
      const systemPrompt = `You are an expert architectural consultant and sustainable design advisor specializing in Canadian building performance, space optimization, and LEED certification pathways.

Analyze the provided architectural drawing and deliver a structured assessment across six dimensions. Base all climate-specific recommendations on the provided climate zone. Do not make pass/fail compliance decisions — provide advisory recommendations only.

1. SPACE DISTRIBUTION EFFICIENCY: Identify wasted areas, flag circulation > 20% GFA, note multi-use opportunities, assess room proportions.
2. NATURAL LIGHT OPTIMIZATION: Identify rooms with no windows, assess WFA ratio (target >10%), note sun path opportunities, flag deep plan conditions (depth > 2.5x window height).
3. ROOM LAYOUT EFFICIENCY: Evaluate functional adjacencies, identify awkward circulation or dead-end corridors, note poor aspect ratios (>3:1), flag structural grid conflicts.
4. WIND AND VENTILATION STRATEGY: Recommend natural ventilation, identify cross-ventilation potential, note stack ventilation opportunities, flag rooms needing operable windows.
5. SUSTAINABLE MATERIALS (climate zone specific): Recommend envelope insulation strategy, suggest glazing specs (U-value, SHGC), identify thermal mass opportunities, note vapour barrier placement.
6. LEED GAP ANALYSIS (LEED v4): Evaluate SS (site, heat island, stormwater), WE (water efficiency, rainwater), EA (energy, renewables), MR (recycled content, local materials), IEQ (daylight, ventilation, low-VOC), IN (innovation). For each: current status, gap, action, estimated points.

Return ONLY valid JSON, no markdown:
{
  "overallScore": number,
  "climateZone": string,
  "drawingType": string,
  "spaceDistribution": { "score": number, "findings": ["string"], "recommendations": ["string"] },
  "naturalLight": { "score": number, "findings": ["string"], "recommendations": ["string"] },
  "roomLayout": { "score": number, "findings": ["string"], "recommendations": ["string"] },
  "ventilation": { "score": number, "findings": ["string"], "recommendations": ["string"] },
  "sustainableMaterials": { "score": number, "findings": ["string"], "recommendations": ["string"] },
  "leedGapAnalysis": {
    "estimatedPoints": number,
    "maxPossiblePoints": number,
    "categories": [{ "category": string, "status": string, "gap": string, "action": string, "estimatedPoints": number }]
  },
  "priorityActions": ["string"],
  "confidence": number
}`;

      try {
        const response = await callAnthropicVision({
          imageBase64,
          mimeType: mimeType as any,
          systemPrompt,
          userPrompt: `Analyze this architectural drawing. Climate zone: ${climateZone ?? 'not specified'} (Canadian NBC climate zones). Return only the JSON object.`,
          jsonSchema: {
            type: "object",
            properties: {
              overallScore: { type: "number" },
              climateZone: { type: "string" },
              drawingType: { type: "string" },
              spaceDistribution: { type: "object" },
              naturalLight: { type: "object" },
              roomLayout: { type: "object" },
              ventilation: { type: "object" },
              sustainableMaterials: { type: "object" },
              leedGapAnalysis: { type: "object" },
              priorityActions: { type: "array", items: { type: "string" } },
              confidence: { type: "number" },
            },
            required: ["overallScore", "drawingType", "priorityActions"],
          },
          maxTokens: 8000,
        });
        // Safety: extract just the JSON object if extra text was returned
        let parsed = response.parsed;
        if (typeof parsed === 'string') {
          const match = (parsed as string).match(/\{[\s\S]*\}/);
          if (match) {
            try { parsed = JSON.parse(match[0]); } catch { /* use as-is */ }
          }
        }
        return { success: true, result: parsed };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
      }
    }),

  // AI Drawing Analysis for extracting dimensions and measurements
  analyzeDrawing: publicProcedure
    .input(
      z.object({
        imageData: z.string(),
        fileName: z.string(),
        municipality: z.string().optional(),
        zoneType: z.string().optional(),
        measurementUnit: z.enum(["mm", "inches", "feet"]).optional().default("feet"),
        isHandDrawn: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const { imageData, fileName, municipality, zoneType, measurementUnit, isHandDrawn } = input;

      // Unit conversion instructions for the AI
      const unitInstructions = measurementUnit === "mm" 
        ? "Convert all measurements to millimeters (mm). For example, 3 feet = 914.4 mm."
        : measurementUnit === "inches"
        ? "Convert all measurements to inches. For example, 3 feet = 36 inches."
        : "Convert all measurements to feet. For example, 914 mm = 3 feet.";

      // Additional context for hand-drawn sketches
      const handDrawnContext = isHandDrawn 
        ? `\n\n**IMPORTANT: This is a HAND-DRAWN SKETCH created by the user.**
Interpret the drawing with more flexibility:
- Lines may not be perfectly straight or aligned
- Shapes may be approximate representations
- Labels and annotations may be informal
- Focus on understanding the user's intent rather than exact measurements
- If dimensions are not labeled, estimate reasonable values based on typical building proportions
- Identify the general layout and room arrangement
- Recognize common architectural symbols even if roughly drawn (doors, windows, stairs, etc.)
`
        : "";

      const prompt = `You are an expert architectural drawing analyst and building code compliance specialist. Analyze this architectural drawing (site plan, floor plan, or elevation) and extract all visible measurements, dimensions, and building code compliance data.${handDrawnContext}

${unitInstructions}

Extract the following information if visible:

**DIMENSIONAL DATA:**
1. Lot dimensions (width and depth)
2. Building footprint dimensions (width and depth)
3. Setback measurements (front, rear, side)
4. Building height (in storeys and actual height)
5. Room labels and approximate areas
6. Scale indicator if present

**BUILDING CODE COMPLIANCE DATA:**
7. Door locations, widths, and swing directions (for egress compliance - min 810mm/32in clear width)
8. Window locations and sizes (for natural light and emergency egress - min 0.35m² opening)
9. Stairway locations, widths, and configurations (min 860mm/34in width for residential)
10. Corridor widths (min 1100mm/44in for public corridors)
11. Fire separation walls (identify any rated assemblies)
12. Accessible route indicators (min 920mm/36in clear width)
13. Plumbing fixture locations (bathrooms, kitchens)
14. Parking spaces count and dimensions (min 2.6m x 5.5m standard)
15. Guard rail and handrail locations

**SAFETY COMPLIANCE:**
16. Emergency egress paths
17. Fire extinguisher locations
18. Smoke detector locations
19. Exit signage locations
20. Occupant load calculation (based on room areas and use)

For each measurement found, provide:
- category: one of "lot-width", "lot-depth", "building-width", "building-depth", "setback-front", "setback-rear", "setback-side", "building-height", "room-area", "door-width", "window-size", "stair-width", "corridor-width", "parking-space", "other"
- value: the numeric value in ${measurementUnit}
- label: a descriptive label
- confidence: "high", "medium", or "low"
- location: approximate position description
- complianceStatus: "pass", "fail", "warning", or "unknown" based on NBC requirements
- nbcReference: relevant NBC code section if applicable (e.g., "NBC 3.4.6.5")

Also identify:
- drawingType: "site-plan", "floor-plan", "elevation", or "unknown"
- scale: the drawing scale if visible (e.g., "1:100", "1/4 inch = 1 foot")
- detectedUnit: the unit of measurement detected on the drawing ("metric", "imperial", or "unknown")

Return ONLY a valid JSON object in this exact format:
{
  "drawingType": "site-plan",
  "scale": "1:100",
  "detectedUnit": "metric",
  "measurements": [
    {
      "id": "unique-id",
      "category": "lot-width",
      "value": 50.0,
      "label": "Lot Width",
      "confidence": "high",
      "location": "Bottom of drawing",
      "complianceStatus": "pass",
      "nbcReference": null
    },
    {
      "id": "door-1",
      "category": "door-width",
      "value": 36.0,
      "label": "Main Entry Door",
      "confidence": "high",
      "location": "Front of building",
      "complianceStatus": "pass",
      "nbcReference": "NBC 3.3.1.13"
    }
  ],
  "rooms": [
    {
      "id": "room-1",
      "name": "Living Room",
      "area": 274.5,
      "location": "Center of floor plan",
      "occupantLoad": 14,
      "occupantLoadFactor": "1.85 m²/person"
    }
  ],
  "complianceIssues": [
    {
      "id": "issue-1",
      "severity": "warning",
      "category": "egress",
      "description": "Bedroom window may not meet minimum egress requirements",
      "nbcReference": "NBC 9.9.10.1",
      "recommendation": "Verify window opening is at least 0.35 m² with min dimension of 380mm"
    }
  ],
  "safetyFeatures": [
    {
      "type": "smoke-detector",
      "location": "Hallway near bedrooms",
      "compliant": true
    }
  ],
  "notes": ["Any additional observations about the drawing"]
}`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: imageData,
                  },
                },
              ],
            },
          ],
          maxTokens: 4000,
        });

        const content = response.choices[0]?.message?.content || "{}";
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = typeof content === 'string' ? content.trim() : JSON.stringify(content);
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/```\n?/g, "");
        }
        
        const analysisResult = JSON.parse(jsonStr);

        return {
          success: true,
          ...analysisResult,
          fileName,
          municipality,
          zoneType,
        };
      } catch (error) {
        console.error("Drawing analysis error:", error);
        return {
          success: false,
          drawingType: "unknown",
          scale: null,
          scalePixelsPerMeter: null,
          measurements: [],
          rooms: [],
          notes: [],
          error: "Failed to analyze drawing. Please try again.",
        };
      }
    }),

  // Project management (already defined above via projectRouter)
  projectsLegacy: router({
    // Get all projects for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, ctx.user.id))
        .orderBy(desc(projects.updatedAt));
      
      return userProjects;
    }),

    // Get a single project by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [project] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
        
        if (!project) throw new Error("Project not found");
        return project;
      }),

    // Create a new project
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          address: z.string().max(500).optional(),
          occupancyCode: z.string().min(1).max(10),
          template: z.string().max(50).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.insert(projects).values({
          userId: ctx.user.id,
          name: input.name,
          address: input.address,
          occupancyCode: input.occupancyCode,
          template: input.template,
          notes: input.notes,
          status: "active",
          overallProgress: 0,
        });
        
        return { success: true, id: 0 }; // ID will be generated by database
      }),

    // Update a project
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          address: z.string().max(500).optional(),
          occupancyCode: z.string().min(1).max(10).optional(),
          template: z.string().max(50).optional(),
          notes: z.string().optional(),
          status: z.enum(["active", "completed", "archived"]).optional(),
          overallProgress: z.number().min(0).max(100).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...updateData } = input;
        
        await db
          .update(projects)
          .set(updateData)
          .where(and(eq(projects.id, id), eq(projects.userId, ctx.user.id)));
        
        return { success: true };
      }),

    // Delete a project
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Delete related calculator results and checklist items first
        await db.delete(projectCalculatorResults).where(eq(projectCalculatorResults.projectId, input.id));
        await db.delete(projectChecklistItems).where(eq(projectChecklistItems.projectId, input.id));
        
        // Delete the project
        await db
          .delete(projects)
          .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
        
        return { success: true };
      }),

    // Calculator results for a project
    calculatorResults: router({
      list: protectedProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // Verify project belongs to user
          const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));
          
          if (!project) throw new Error("Project not found");
          
          const results = await db
            .select()
            .from(projectCalculatorResults)
            .where(eq(projectCalculatorResults.projectId, input.projectId))
            .orderBy(desc(projectCalculatorResults.updatedAt));
          
          return results;
        }),

      save: protectedProcedure
        .input(
          z.object({
            projectId: z.number(),
            calculatorType: z.string().min(1).max(50),
            inputData: z.string(),
            resultData: z.string(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // Verify project belongs to user
          const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));
          
          if (!project) throw new Error("Project not found");
          
          const result = await db.insert(projectCalculatorResults).values({
            projectId: input.projectId,
            calculatorType: input.calculatorType,
            inputData: input.inputData,
            resultData: input.resultData,
            notes: input.notes,
          });
          
          return { success: true, id: 0 }; // ID will be generated by database
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.number(), projectId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // Verify project belongs to user
          const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));
          
          if (!project) throw new Error("Project not found");
          
          await db
            .delete(projectCalculatorResults)
            .where(eq(projectCalculatorResults.id, input.id));
          
          return { success: true };
        }),
    }),

    // Checklist items for a project
    checklistItems: router({
      list: protectedProcedure
        .input(z.object({ projectId: z.number(), phase: z.string().optional() }))
        .query(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // Verify project belongs to user
          const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));
          
          if (!project) throw new Error("Project not found");
          
          let query = db
            .select()
            .from(projectChecklistItems)
            .where(eq(projectChecklistItems.projectId, input.projectId));
          
          if (input.phase) {
            query = db
              .select()
              .from(projectChecklistItems)
              .where(and(
                eq(projectChecklistItems.projectId, input.projectId),
                eq(projectChecklistItems.phase, input.phase)
              ));
          }
          
          return await query;
        }),

      save: protectedProcedure
        .input(
          z.object({
            projectId: z.number(),
            phase: z.string().min(1).max(50),
            itemId: z.string().min(1).max(100),
            itemText: z.string(),
            isCompleted: z.boolean().optional(),
            notes: z.string().optional(),
            photoUrl: z.string().max(500).optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // Verify project belongs to user
          const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));
          
          if (!project) throw new Error("Project not found");
          
          // Check if item already exists
          const [existing] = await db
            .select()
            .from(projectChecklistItems)
            .where(and(
              eq(projectChecklistItems.projectId, input.projectId),
              eq(projectChecklistItems.itemId, input.itemId)
            ));
          
          if (existing) {
            // Update existing item
            await db
              .update(projectChecklistItems)
              .set({
                isCompleted: input.isCompleted ? 1 : 0,
                completedAt: input.isCompleted ? new Date() : null,
                notes: input.notes,
                photoUrl: input.photoUrl,
              })
              .where(eq(projectChecklistItems.id, existing.id));
            
            return { success: true, id: existing.id };
          } else {
            // Create new item
            const result = await db.insert(projectChecklistItems).values({
              projectId: input.projectId,
              phase: input.phase,
              itemId: input.itemId,
              itemText: input.itemText,
              isCompleted: input.isCompleted ? 1 : 0,
              completedAt: input.isCompleted ? new Date() : null,
              notes: input.notes,
              photoUrl: input.photoUrl,
            });
            
            return { success: true, id: 0 }; // ID will be generated by database
          }
        }),

      toggle: protectedProcedure
        .input(z.object({ id: z.number(), projectId: z.number(), isCompleted: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // Verify project belongs to user
          const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));
          
          if (!project) throw new Error("Project not found");
          
          await db
            .update(projectChecklistItems)
            .set({
              isCompleted: input.isCompleted ? 1 : 0,
              completedAt: input.isCompleted ? new Date() : null,
            })
            .where(eq(projectChecklistItems.id, input.id));
          
          // Update project progress
          const allItems = await db
            .select()
            .from(projectChecklistItems)
            .where(eq(projectChecklistItems.projectId, input.projectId));
          
          const completedCount = allItems.filter(item => item.isCompleted === 1).length;
          const progress = allItems.length > 0 ? Math.round((completedCount / allItems.length) * 100) : 0;
          
          await db
            .update(projects)
            .set({ overallProgress: progress })
            .where(eq(projects.id, input.projectId));
          
          return { success: true, progress };
        }),

      bulkSave: protectedProcedure
        .input(
          z.object({
            projectId: z.number(),
            items: z.array(
              z.object({
                phase: z.string().min(1).max(50),
                itemId: z.string().min(1).max(100),
                itemText: z.string(),
                status: z.enum(["pass", "fail", "conditional", "pending"]).optional(),
                notes: z.string().optional(),
              })
            ),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // Verify project belongs to user
          const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));
          
          if (!project) throw new Error("Project not found");
          
          // Save all items
          for (const item of input.items) {
            const [existing] = await db
              .select()
              .from(projectChecklistItems)
              .where(and(
                eq(projectChecklistItems.projectId, input.projectId),
                eq(projectChecklistItems.itemId, item.itemId)
              ));
            
            if (existing) {
              // Update existing item
              await db
                .update(projectChecklistItems)
                .set({
                  itemText: item.itemText,
                  notes: item.notes,
                })
                .where(eq(projectChecklistItems.id, existing.id));
            } else {
              // Create new item
              await db.insert(projectChecklistItems).values({
                projectId: input.projectId,
                phase: item.phase,
                itemId: item.itemId,
                itemText: item.itemText,
                notes: item.notes,
              });
            }
          }
          
          return { success: true, count: input.items.length };
        }),
    }),
  }),

  // Feedback submission for beta testing
  feedback: router({
    submit: publicProcedure
      .input(
        z.object({
          rating: z.number().min(1).max(5),
          feedbackType: z.enum(["bug", "feature", "improvement", "other"]),
          category: z.string().optional(),
          title: z.string().min(1).max(255),
          description: z.string().min(1),
          name: z.string().optional(),
          email: z.string().email().optional(),
          currentPage: z.string().optional(),
          browserInfo: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          await db.insert(feedbacks).values({
            userId: ctx.user?.id,
            name: input.name,
            email: input.email,
            rating: input.rating,
            feedbackType: input.feedbackType,
            category: input.category,
            title: input.title,
            description: input.description,
            currentPage: input.currentPage,
            browserInfo: input.browserInfo,
            resolved: 0,
          });

          return {
            success: true,
            message: "Feedback submitted successfully",
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("Feedback submission error:", message);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Feedback submission failed: ${message}`,
          });
        }
      }),
  }),

  // Drawing Analysis Procedures
  saveDrawingAnalysis: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        imageUrl: z.string(),
        occupancyType: z.string(),
        infractions: z.array(
          z.object({
            id: z.string(),
            severity: z.enum(["critical", "warning", "info"]),
            code: z.string(),
            title: z.string(),
            description: z.string(),
            location: z.string(),
            recommendation: z.string(),
            x: z.number(),
            y: z.number(),
          })
        ),
        drawingType: z.string().optional(),
        scale: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const id = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(projectCalculatorResults).values({
        projectId: input.projectId,
        calculatorType: "drawingAnalysis",
        inputData: JSON.stringify({
          fileName: input.fileName,
          occupancyType: input.occupancyType,
          drawingType: input.drawingType,
          scale: input.scale,
          imageUrl: input.imageUrl,
        }),
        resultData: JSON.stringify({
          infractions: input.infractions,
          totalInfractions: input.infractions.length,
          criticalCount: input.infractions.filter((i: any) => i.severity === "critical").length,
          warningCount: input.infractions.filter((i: any) => i.severity === "warning").length,
          infoCount: input.infractions.filter((i: any) => i.severity === "info").length,
        }),
      });

      return { success: true, id };
    }),

  getDrawingAnalyses: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const results = await db
        .select()
        .from(projectCalculatorResults)
        .where(
          and(
            eq(projectCalculatorResults.projectId, input.projectId),
            eq(projectCalculatorResults.calculatorType, "drawingAnalysis")
          )
        )
        .orderBy(desc(projectCalculatorResults.createdAt))
        .limit(20);

      return results.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        inputData: JSON.parse(r.inputData || "{}"),
        resultData: JSON.parse(r.resultData || "{}"),
        createdAt: r.createdAt,
      }));
    }),

  exportFindingsToCompliance: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        drawingAnalysisId: z.string(),
        rulesetId: z.string().default("nbc_2023_v1"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get the drawing analysis
      const [analysis] = await db
        .select()
        .from(projectCalculatorResults)
        .where(eq(projectCalculatorResults.id, parseInt(input.drawingAnalysisId, 10)))
        .limit(1);

      if (!analysis) throw new TRPCError({ code: "NOT_FOUND" });

      const resultData = JSON.parse(analysis.resultData || "{}");
      const infractions = resultData.infractions ?? [];

      const hasNonCompliant = infractions.some((i: any) => i.severity === "critical");
      const complianceStatus = infractions.length === 0 ? "compliant" : hasNonCompliant ? "non_compliant" : "conditional";

      const snapshotId = `snap_drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(complianceSnapshots).values({
        snapshotId,
        projectId: input.projectId,
        userId: ctx.user.id,
        rulesetId: input.rulesetId,
        mode: "soft",
        inputs: analysis.inputData,
        outputs: JSON.stringify({
          infractions,
          source: "drawingAnalysis",
        }),
        ruleTrace: JSON.stringify(
          infractions.map((i: any) => ({
            rule_id: i.code,
            clause: i.code,
            fired: true,
            conditions_met: true,
          }))
        ),
        complianceStatus,
      });

      await db.insert(auditLog).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        snapshotId,
        action: "drawing_analysis_exported",
        details: JSON.stringify({
          drawingAnalysisId: input.drawingAnalysisId,
          infractionCount: infractions.length,
          complianceStatus,
        }),
      });

      return { success: true, snapshotId, complianceStatus };
    }),

});

export type AppRouter = typeof appRouter;
