import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getLimits } from "../services/travelDistanceService";

export const travelDistanceRouter = router({
  getLimits: publicProcedure
    .input(z.object({ occupancyMajor: z.string().trim().nullable().optional() }))
    .query(({ input }) => getLimits(input.occupancyMajor ?? null)),
});
