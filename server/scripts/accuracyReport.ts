/**
 * Accuracy Report — Sprint 1
 *
 * Standalone script that queries accumulated Roboflow IoU data and prints
 * a baseline accuracy summary. Run with:
 *   DOTENV_CONFIG_PATH=.env.local tsx server/scripts/accuracyReport.ts
 *
 * Outputs aggregate statistics across all analyzed pages that had Roboflow
 * coverage. Use this to establish the baseline before any prompt changes.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql, isNotNull } from 'drizzle-orm';
import { detectedRooms, roboflowUnmatchedDetections } from '../../drizzle/schema';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Run with: DOTENV_CONFIG_PATH=.env.local tsx server/scripts/accuracyReport.ts');
    process.exit(1);
  }

  const db = drizzle(databaseUrl);

  // Rooms where Roboflow was available (roboflowMatched is not NULL)
  const [matchStats] = await db
    .select({
      totalRooms: sql<number>`COUNT(*)`,
      matchedRooms: sql<number>`SUM(CASE WHEN ${detectedRooms.roboflowMatched} = 1 THEN 1 ELSE 0 END)`,
      unmatchedRooms: sql<number>`SUM(CASE WHEN ${detectedRooms.roboflowMatched} = 0 THEN 1 ELSE 0 END)`,
      avgIou: sql<number>`AVG(CASE WHEN ${detectedRooms.roboflowMatched} = 1 THEN CAST(${detectedRooms.roboflowIou} AS DECIMAL(5,4)) END)`,
      minIou: sql<number>`MIN(CASE WHEN ${detectedRooms.roboflowMatched} = 1 THEN CAST(${detectedRooms.roboflowIou} AS DECIMAL(5,4)) END)`,
      maxIou: sql<number>`MAX(CASE WHEN ${detectedRooms.roboflowMatched} = 1 THEN CAST(${detectedRooms.roboflowIou} AS DECIMAL(5,4)) END)`,
    })
    .from(detectedRooms)
    .where(isNotNull(detectedRooms.roboflowMatched));

  // Unmatched Roboflow detections (rooms Claude missed)
  const [unmatchedStats] = await db
    .select({
      totalUnmatched: sql<number>`COUNT(*)`,
      uniquePages: sql<number>`COUNT(DISTINCT ${roboflowUnmatchedDetections.pageId})`,
    })
    .from(roboflowUnmatchedDetections);

  // IoU distribution buckets
  const buckets = await db
    .select({
      bucket: sql<string>`
        CASE
          WHEN CAST(${detectedRooms.roboflowIou} AS DECIMAL(5,4)) >= 0.9 THEN '0.90-1.00'
          WHEN CAST(${detectedRooms.roboflowIou} AS DECIMAL(5,4)) >= 0.7 THEN '0.70-0.89'
          WHEN CAST(${detectedRooms.roboflowIou} AS DECIMAL(5,4)) >= 0.5 THEN '0.50-0.69'
          WHEN CAST(${detectedRooms.roboflowIou} AS DECIMAL(5,4)) >= 0.3 THEN '0.30-0.49'
          ELSE '<0.30'
        END`,
      count: sql<number>`COUNT(*)`,
    })
    .from(detectedRooms)
    .where(isNotNull(detectedRooms.roboflowIou))
    .groupBy(sql`1`)
    .orderBy(sql`1 DESC`);

  const matched = Number(matchStats.matchedRooms ?? 0);
  const unmatched = Number(matchStats.unmatchedRooms ?? 0);
  const total = Number(matchStats.totalRooms ?? 0);
  const rfMissed = Number(unmatchedStats.totalUnmatched ?? 0);
  const precision = total > 0 ? (matched / total * 100).toFixed(1) : 'N/A';
  const recall = (matched + rfMissed) > 0
    ? (matched / (matched + rfMissed) * 100).toFixed(1)
    : 'N/A';

  console.log('\n=== Roboflow Accuracy Baseline Report ===\n');
  console.log(`Rooms with Roboflow coverage : ${total}`);
  console.log(`  Matched (IoU ≥ 0.30)       : ${matched}`);
  console.log(`  No Roboflow match           : ${unmatched}`);
  console.log(`  Avg IoU (matched only)      : ${matchStats.avgIou != null ? Number(matchStats.avgIou).toFixed(3) : 'N/A'}`);
  console.log(`  Min IoU                     : ${matchStats.minIou != null ? Number(matchStats.minIou).toFixed(3) : 'N/A'}`);
  console.log(`  Max IoU                     : ${matchStats.maxIou != null ? Number(matchStats.maxIou).toFixed(3) : 'N/A'}`);
  console.log('');
  console.log(`Roboflow rooms Claude missed  : ${rfMissed}  (across ${unmatchedStats.uniquePages} page(s))`);
  console.log('');
  console.log(`Precision (matched / total-RF-coverage rooms) : ${precision}%`);
  console.log(`Recall    (matched / matched + RF-missed)      : ${recall}%`);
  console.log('');
  console.log('IoU Distribution (matched rooms):');
  for (const b of buckets) {
    console.log(`  ${b.bucket}  : ${b.count}`);
  }
  console.log('');
  console.log('Run this script after each prompt change to track improvements.\n');

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
