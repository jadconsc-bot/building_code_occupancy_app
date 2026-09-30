import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";
import { formatTrpcErrorShape } from "./trpc";

describe("tRPC error formatting", () => {
  it("turns Zod input errors into a short human-readable message and preserves zodError", () => {
    const schema = z.object({ limitingDistanceM: z.number().positive() });
    let error: ZodError;
    try { schema.parse({ limitingDistanceM: -1 }); } catch (caught) { error = caught as ZodError; }
    const zodError = { fieldErrors: { limitingDistanceM: ["must be greater than 0"] } };
    const shape = { message: "raw", data: { code: "BAD_REQUEST", zodError } };
    const result = formatTrpcErrorShape({ shape, error: { cause: error! } });
    expect(result.message).toContain("limitingDistanceM must be greater than 0");
    expect(result.data.zodError).toBe(zodError);
  });

  it("leaves non-Zod errors unchanged", () => {
    const shape = { message: "internal", data: { code: "INTERNAL_SERVER_ERROR" } };
    expect(formatTrpcErrorShape({ shape, error: { cause: new Error("internal") } })).toBe(shape);
  });
});
