import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { rulesets, type InsertRuleset } from "../../drizzle/schema";

// Exported verbatim from staging on 2026-10-04; database-generated IDs and
// audit timestamps are intentionally omitted. Existing rulesets are preserved.
const rulesetValues: InsertRuleset[] = [
  {
    rulesetId: "bcbc_2024_v1",
    code: "BCBC",
    edition: "2024",
    amendment: null,
    version: "1.0",
    effectiveDate: new Date("2024-01-01T00:00:00Z"),
    retiredDate: null,
    description: "BC Building Code 2024",
    rulesData: "[]",
  },
  {
    rulesetId: "nbc_2020_v1",
    code: "NBC",
    edition: "2020",
    amendment: null,
    version: "1.0",
    effectiveDate: new Date("2020-01-01T00:00:00Z"),
    retiredDate: null,
    description: "National Building Code of Canada 2020",
    rulesData: "[]",
  },
  {
    rulesetId: "nbc_2023_ab_v1",
    code: "NBC(AE)",
    edition: "2023",
    amendment: "2023-12",
    version: "1.0",
    effectiveDate: new Date("2023-01-01T00:00:00Z"),
    retiredDate: null,
    description: "National Building Code - Alberta Edition 2023",
    rulesData: "[]",
  },
  {
    rulesetId: "nbc_2025_v1",
    code: "NBC",
    edition: "2025",
    amendment: null,
    version: "1.0",
    effectiveDate: new Date("2025-01-01T00:00:00Z"),
    retiredDate: null,
    description: "National Building Code of Canada 2025",
    rulesData: "[]",
  },
];

export async function seedRulesets() {
  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable");
  await db.insert(rulesets).values(rulesetValues).onDuplicateKeyUpdate({
    set: { rulesetId: sql`${rulesets.rulesetId}` },
  });
  console.log("rulesets seeded: 4 configured rows (existing rows unchanged)");
}
