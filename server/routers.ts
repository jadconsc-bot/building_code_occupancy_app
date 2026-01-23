import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { feedbacks } from "../drizzle/schema";
import { getDb } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
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

  // AI Drawing Analysis for extracting dimensions and measurements
  analyzeDrawing: publicProcedure
    .input(
      z.object({
        imageData: z.string(),
        fileName: z.string(),
        municipality: z.string().optional(),
        zoneType: z.string().optional(),
        measurementUnit: z.enum(["mm", "inches", "feet"]).optional().default("feet"),
      })
    )
    .mutation(async ({ input }) => {
      const { imageData, fileName, municipality, zoneType, measurementUnit } = input;

      // Unit conversion instructions for the AI
      const unitInstructions = measurementUnit === "mm" 
        ? "Convert all measurements to millimeters (mm). For example, 3 feet = 914.4 mm."
        : measurementUnit === "inches"
        ? "Convert all measurements to inches. For example, 3 feet = 36 inches."
        : "Convert all measurements to feet. For example, 914 mm = 3 feet.";

      const prompt = `You are an expert architectural drawing analyst and building code compliance specialist. Analyze this architectural drawing (site plan, floor plan, or elevation) and extract all visible measurements, dimensions, and building code compliance data.

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
          console.error("Feedback submission error:", error);
          throw new Error("Failed to submit feedback");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
