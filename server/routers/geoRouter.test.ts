import { describe, expect, it } from "vitest";
import { geoRateLimited, mapGoogleProvince, mapGoogleProvinceFull } from "./geoRouter";

describe("geo address helpers", () => {
  it.each([
    ["AB", "AB"],
    ["BC", "BC"],
    ["ON", "ON"],
  ])("maps supported Google province code %s", (input, expected) => {
    expect(mapGoogleProvince(input)).toBe(expected);
  });

  it.each([undefined, null, "SK", "California"])("returns null for unsupported province %s", (input) => {
    expect(mapGoogleProvince(input)).toBeNull();
  });

  it.each(["AB", "BC", "ON", "QC", "SK"])("maps full Canadian province code %s", (input) => {
    expect(mapGoogleProvinceFull(input)).toBe(input);
  });

  it.each([undefined, null, "California", "A"])("returns null for invalid full province code %s", (input) => {
    expect(mapGoogleProvinceFull(input)).toBeNull();
  });

  it("allows 30 requests per IP in a rolling minute, then rate-limits", () => {
    const ip = `geo-test-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 30; i++) expect(geoRateLimited(ip)).toBe(false);
    expect(geoRateLimited(ip)).toBe(true);
  });
});
