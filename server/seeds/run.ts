import { seedJurisdictionProfiles } from "./jurisdictionProfiles";

seedJurisdictionProfiles()
  .then(() => { console.log("Seed complete."); process.exit(0); })
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); });
