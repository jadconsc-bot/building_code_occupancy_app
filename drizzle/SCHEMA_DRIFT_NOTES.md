# Schema / DB Drift Notes

**Last updated:** June 22, 2026  
**DB:** Railway (MySQL 8)  
**Standing rule:** DB is source of truth for type decisions on columns with live data.
schema.ts should match the DB — not the other way around — unless a deliberate migration
is being executed with a specific, reviewed SQL statement.

---

## Status: Reconciliation complete as of 2026-06-22

All known drift items have been resolved or accepted. The only remaining delta between
schema.ts and the live DB is the permanent tinyint(1) drift documented below.

---

## Resolved this session (2026-06-22)

### Orphaned columns dropped (raw SQL — all confirmed 0 non-null rows except where noted)
| Table | Column | Notes |
|---|---|---|
| detectedRooms | correctedBy | 0/2266 non-null |
| detectedRooms | correctedAt | 0/2266 non-null |
| drawingAnalyses | fileUrl | 0/354 non-null |
| drawingDataExtractions | drawingType | 0/271 non-null |
| drawingDataExtractions | jurisdiction | 0/271 non-null |
| drawingDataExtractions | confidence | 0/271 non-null |
| drawingDataExtractions | createdAt | 271/271 non-null — legacy timestamp superseded by extractedAt |
| projects | lat | 0/12 non-null |
| projects | lng | 0/12 non-null |
| projects | jurisdictionProfileId | 0/12 non-null |
| users | organization | 0/8 non-null |
| users | userRole | 8/8 non-null — legacy; active column is users.role |

### Orphaned tables dropped (confirmed 0 ORM references)
| Table | Row count |
|---|---|
| codeRules | 60 |
| occupancyClassifications | 13 |

### schema.ts type fixes applied
| Table | Column | Was | Now | Method |
|---|---|---|---|---|
| trainingExamples | imageCropBase64 | text | mediumtext | schema.ts fix |
| complianceAuditTrail | userEmail | varchar(255) | varchar(320) | schema.ts fix |
| drawingDataExtractions | extractionModel | varchar(50) notNull | varchar(100) nullable | schema.ts fix |
| detectedRooms | boundingBoxJson | text notNull | json notNull | schema.ts fix |
| detectedRooms | flagsJson | text | json | schema.ts fix |
| detectedFeatures | positionJson | text notNull | json notNull | schema.ts fix |
| detectedFeatures | metadataJson | text | json | schema.ts fix |
| drawingAnalyses | analysisType | mysqlEnum | varchar(50) | schema.ts fix |
| drawingAnalyses | complianceLevel | mysqlEnum | varchar(50) | schema.ts fix |
| projects | constructionType | mysqlEnum | varchar(50) | schema.ts fix |
| projects | siteConstraints | missing | text nullable | schema.ts restored |
| drawingAnalyses | drawingUrl | text notNull | varchar(500) nullable | schema.ts fix |
| drawingAnalyses | drawingHash | notNull | nullable | schema.ts fix |
| drawingAnalyses | disclaimerVersion | notNull | nullable | schema.ts fix |
| drawingDataExtractions | extractedData | notNull | nullable | schema.ts fix |
| drawingDataExtractions | extractionPromptVersion | notNull | nullable | schema.ts fix |
| detectedRooms | confidence | decimal(4,3) notNull | decimal(3,2) nullable | schema.ts fix |
| detectedFeatures | confidence | decimal(4,3) notNull | decimal(3,2) nullable | schema.ts fix |
| detectedFeatures | featureType | varchar(100) | varchar(50) | schema.ts fix |
| complianceMonitorSnapshots | fetchedAt | timestamp | datetime | schema.ts reverted to match DB |
| complianceMonitorSnapshots | createdAt | timestamp | datetime | schema.ts reverted to match DB |
| complianceNotifications | changeDetectedAt | timestamp | datetime | schema.ts reverted to match DB |
| complianceNotifications | reviewedAt | timestamp | datetime | schema.ts reverted to match DB |
| complianceNotifications | createdAt | timestamp | datetime | schema.ts reverted to match DB |
| drawingPages | evalAccuracy | decimal(4,3) | float | schema.ts reverted to match DB |
| drawingPages | calibrationScale | decimal(12,6) | float | schema.ts reverted to match DB |

### DB changes pushed via drizzle-kit push
| Table | Column | Change | Data verified safe |
|---|---|---|---|
| drawingDataExtractions | extractionConfidence | decimal(5,2) → decimal(3,2) | ✓ all 271 values ≤ 0.90 |
| drawingAnalyses | drawingSnapshotMimeType | varchar(100) → varchar(50) | ✓ max stored length 10 chars |
| drawingAnalyses | llmModelVersion | varchar(20) → varchar(50) | ✓ widening; prevents future truncation |
| complianceAuditTrail | details | nullable → NOT NULL | ✓ 0 null rows |
| complianceAuditTrail | userEmail | nullable → NOT NULL | ✓ 0 null rows |
| homeReports | reportToken | added UNIQUE constraint | ✓ |
| projects | is_immutable | added column (tinyint notNull default 1) | ✓ safe add |
| trainingExamples | addedToTraining | added column (tinyint default 1) | ✓ safe add |

---

## Accepted permanent drift — DO NOT attempt to fix via drizzle-kit push

### tinyint(1) vs tinyint — LEAVE AS-IS PERMANENTLY

**Affected columns:**
| Table | Column |
|---|---|
| detectedRooms | polygonLeakSuspected |
| detectedRooms | flaggedForReview |
| detectedRooms | manualOverride |
| detectedRooms | roboflowMatched |
| drawingPages | vectorExtracted |
| projects | sprinklersRequired |
| projects | is_immutable |
| trainingExamples | addedToTraining |
| trainingExamples | isActive |

**Why this is accepted permanently:**

drizzle-kit push attempts to `TRUNCATE` the affected tables in order to apply this
cosmetic display-width change. This is blocked by FK constraints and would destroy live
data even if it succeeded. The change has zero behavioral effect:

- MySQL 8.0.17+ deprecated integer display widths
- `tinyint(1)` and `tinyint` are stored identically, compared identically, and returned
  identically by the MySQL wire protocol
- All boolean-style columns using tinyint(1) work correctly in production

**Standing rule:** Do NOT run drizzle-kit push for any schema change that would touch
these tables as part of a tinyint(1) fix. Apply any future legitimate schema changes
for these tables via raw `ALTER TABLE` statements instead, bypassing drizzle-kit's
table-rewrite strategy.

---

## How to apply future schema changes

For tables affected by the tinyint(1) drift (listed above):
```sql
-- Use raw ALTER TABLE for additive changes
ALTER TABLE `detectedRooms` ADD COLUMN `newCol` varchar(100);
ALTER TABLE `detectedRooms` MODIFY COLUMN `existingCol` text;
-- Do NOT use drizzle-kit push for these tables
```

For all other tables: `! npx drizzle-kit push` in the Claude Code terminal (real TTY
required — do not pipe to a file).
