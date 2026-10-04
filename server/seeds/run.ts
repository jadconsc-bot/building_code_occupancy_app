import { seedJurisdictionProfiles } from "./jurisdictionProfiles";
import { seedRulesets } from "./rulesets";

seedJurisdictionProfiles()
  .then(() => seedRulesets())
  .then(() => { console.log("Seed complete."); process.exit(0); })
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); });
