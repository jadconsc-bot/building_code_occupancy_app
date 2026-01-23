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
      })
    )
    .mutation(async ({ input }) => {
      const { imageData, fileName, municipality, zoneType } = input;

      const prompt = `You are an expert architectural drawing analyst. Analyze this architectural drawing (site plan, floor plan, or elevation) and extract all visible measurements and dimensions.

Extract the following information if visible:
1. Lot dimensions (width and depth in meters)
2. Building footprint dimensions (width and depth in meters)
3. Setback measurements (front, rear, side in meters)
4. Building height (in meters or storeys)
5. Room labels and approximate areas
6. Scale indicator if present
7. Any other relevant dimensions

For each measurement found, provide:
- category: one of "lot-width", "lot-depth", "building-width", "building-depth", "setback-front", "setback-rear", "setback-side", "building-height", "room-area", "other"
- value: the numeric value in meters (convert if in feet)
- label: a descriptive label
- confidence: "high", "medium", or "low"
- location: approximate position description

Also identify:
- drawingType: "site-plan", "floor-plan", "elevation", or "unknown"
- scale: the drawing scale if visible (e.g., "1:100", "1/4 inch = 1 foot")
- scalePixelsPerMeter: estimated pixels per meter if scale is determinable

Return ONLY a valid JSON object in this exact format:
{
  "drawingType": "site-plan",
  "scale": "1:100",
  "scalePixelsPerMeter": null,
  "measurements": [
    {
      "id": "unique-id",
      "category": "lot-width",
      "value": 15.2,
      "label": "Lot Width",
      "confidence": "high",
      "location": "Bottom of drawing"
    }
  ],
  "rooms": [
    {
      "id": "room-1",
      "name": "Living Room",
      "area": 25.5,
      "location": "Center of floor plan"
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
