import { describe, expect, it, vi } from "vitest";

vi.mock("../services/anthropicTextService.js", () => ({
  callAnthropicText: vi.fn().mockResolvedValue({
    text: "A limiting distance is the measured space between a building face and the property line.",
    modelVersion: "test-model",
  }),
}));

import { homeRouter } from "./homeRouter";

describe("home.explainTerm", () => {
  it("returns a plain-language explanation", async () => {
    const caller = homeRouter.createCaller({ req: { ip: "home-explain-test" } } as any);
    const result = await caller.explainTerm({ term: "limiting distance", context: "spatial separation" });
    expect(result.explanation).toContain("limiting distance");
  });

  it("rejects full answer objects instead of accepting them as context", async () => {
    const caller = homeRouter.createCaller({ req: { ip: "home-explain-validation-test" } } as any);
    await expect(caller.explainTerm({ term: { province: "BC", projectType: "secondary_suite" } as any })).rejects.toThrow();
  });
});
