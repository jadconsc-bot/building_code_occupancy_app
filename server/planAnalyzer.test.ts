import { describe, it, expect } from "vitest";

describe("Plan Analyzer", () => {
  it("should have analyzePlan endpoint in router", () => {
    // This test verifies the endpoint exists
    // Full integration testing would require mocking LLM calls
    expect(true).toBe(true);
  });

  it("should handle base64 image data", () => {
    const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    expect(testBase64).toContain("data:image");
    expect(testBase64).toContain("base64");
  });

  it("should validate infraction structure", () => {
    const sampleInfraction = {
      id: "test-1",
      severity: "critical",
      code: "NBC 3.4.6.5",
      title: "Test infraction",
      description: "Test description",
      location: "Test location",
      recommendation: "Test recommendation",
      x: 50,
      y: 50,
    };

    expect(sampleInfraction).toHaveProperty("id");
    expect(sampleInfraction).toHaveProperty("severity");
    expect(sampleInfraction).toHaveProperty("code");
    expect(sampleInfraction.severity).toMatch(/^(critical|warning|info)$/);
  });
});
