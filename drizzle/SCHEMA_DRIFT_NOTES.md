# Schema / DB Drift Notes

**Audit date:** June 22, 2026  
**DB:** Railway (MySQL 8)  
**Standing rule:** DB is source of truth for type decisions on columns with live data.
schema.ts should match the DB — not the other way around — unless a deliberate migration
is being executed with a specific, reviewed SQL statement.

---

## Resolved this session (2026-06-22)

### Column drops (raw SQL, confirmed 0 non-null rows except where noted)
| Table | Column | Notes |
|---|---|---|
| detectedRooms | correctedBy | 0/2266 non-null |
| detectedRooms | correctedAt | 0/2266 non-null |
| drawingAnalyses | fileUrl | 0/354 non-null |
| drawingDataExtractions | drawingType | 0/271 non-null |
| drawingDataExtractions | jurisdiction | 0/271 non-null |
| drawingDataExtractions | confidence | 0/271 non-null |
| drawingDataExtractions | createdAt | 271/271 non-null — legacy timestamp superseded by extractedAt; no code read it |
| projects | lat | 0/12 non-null |
| projects | lng | 0/12 non-null |
| projects | jurisdictionProfileId | 0/12 non-null |
| users | organization | 0/8 non-null |
| users | userRole | 8/8 non-null — legacy; active column is users.role |

### Table drops (confirmed 0 ORM references)
| Table | Row count |
|---|---|
| codeRules | 60 |
| occupancyClassifications | 13 |

### schema.ts type fixes (committed fd4b976)
| Table | Column | Was | Now | Reason |
|---|---|---|---|---|
| trainingExamples | imageCropBase64 | text | mediumtext | Live data max ~180KB; text limit is 64KB — silent truncation risk |
| complianceAuditTrail | userEmail | varchar(255) | varchar(320) | RFC 5321 max email length is 320 chars |
| drawingDataExtractions | extractionModel | varchar(50) notNull | varchar(100) nullable | DB is varchar(100), nullable |
| detectedRooms | boundingBoxJson | text notNull | json notNull | DB is json; restores JSON validation |
| detectedRooms | flagsJson | text | json | DB is json |
| detectedFeatures | positionJson | text notNull | json notNull | DB is json |
| detectedFeatures | metadataJson | text | json | DB is json |
| drawingAnalyses | analysisType | mysqlEnum | varchar(50) | DB is varchar |
| drawingAnalyses | complianceLevel | mysqlEnum | varchar(50) | DB is varchar |
| projects | constructionType | mysqlEnum | varchar(50) | DB is varchar |
| drawingAnalyses | drawingUrl | notNull | nullable | DB allows NULL |
| drawingAnalyses | drawingHash | notNull | nullable | DB allows NULL |
| drawingAnalyses | disclaimerVersion | notNull | nullable | DB allows NULL |
| drawingDataExtractions | extractedData | notNull | nullable | DB allows NULL |
| drawingDataExtractions | extractionPromptVersion | notNull | nullable | DB allows NULL |
| detectedRooms | confidence | notNull | nullable | DB allows NULL |
| detectedFeatures | confidence | notNull | nullable | DB allows NULL |

---

## Remaining deferred drift — DO NOT push without per-item review

### 1. tinyint(1) vs tinyint — COSMETIC, SAFE EITHER WAY
MySQL 8.0.17+ treats `tinyint(1)` and `tinyint` identically at the storage level.
drizzle-kit emits `tinyint(1)` for boolean-like columns; the DB stores bare `tinyint`.
No data risk. Can be resolved in either direction without a migration concern.

Affected columns: multiple boolean-style columns across detectedRooms, drawingAnalyses, etc.

**Action:** Accept drizzle-kit's cosmetic re-emit, or leave as-is. No urgency.

---

### 2. datetime → timestamp — NEEDS REVIEW BEFORE PUSHING
| Table | Column | DB type | schema.ts type | Live rows |
|---|---|---|---|---|
| (nbcRules or similar) | fetchedAt | datetime | timestamp | ~4230 |
| (nbcRules or similar) | createdAt | datetime | timestamp | ~4230 |

`datetime` stores wall-clock time with no timezone; `timestamp` is stored as UTC and
converted on read using the session timezone. Pushing a datetime→timestamp ALTER will
NOT lose data but will shift displayed values if the app server and DB timezone ever differ.

**Action:** Confirm all app code reads these columns in UTC context before pushing.
Verify `@@global.time_zone` and `@@session.time_zone` on Railway are both UTC.

---

### 3. float → decimal — NEEDS REVIEW BEFORE PUSHING
| Table | Column | DB type | schema.ts type | Live rows |
|---|---|---|---|---|
| (detectedRooms or complianceResults) | evalAccuracy | float | decimal | ~149 |
| (detectedRooms or complianceResults) | calibrationScale | float | decimal | ~149 |

float is approximate (IEEE 754); decimal is exact. Pushing ALTER COLUMN float→decimal
will rewrite all 149 rows. Values will be rounded to the specified precision.
Floating-point values that don't have an exact decimal representation may change.

**Action:** Run `SELECT MIN(evalAccuracy), MAX(evalAccuracy), MIN(calibrationScale),
MAX(calibrationScale) FROM <table>` and confirm the decimal precision in schema.ts
(e.g., decimal(5,4)) can represent all live values without rounding loss before pushing.

---

### 4. drawingSnapshotMimeType varchar(100) → varchar(50) — SHRINK RISK
| Table | Column | DB type | schema.ts type | Live rows |
|---|---|---|---|---|
| drawingAnalyses | drawingSnapshotMimeType | varchar(100) | varchar(50) | ~354 |

schema.ts declares varchar(50) but DB is varchar(100). Pushing will ALTER the column
to varchar(50), which will TRUNCATE any stored values longer than 50 chars.

**Action:** Run `SELECT MAX(LENGTH(drawingSnapshotMimeType)) FROM drawingAnalyses`
before pushing. If max length ≤ 50, safe to push. If > 50, widen schema.ts to varchar(100)
instead. Do NOT push until this is confirmed.

---

### 5. extractionConfidence decimal(5,2) → decimal(3,2) — PRECISION REDUCTION, HIGH RISK
| Table | Column | DB type | schema.ts type | Live rows |
|---|---|---|---|---|
| drawingDataExtractions | extractionConfidence | decimal(5,2) | decimal(3,2) | 271 |

schema.ts declares decimal(3,2) but DB is decimal(5,2). This is a precision REDUCTION.
decimal(3,2) can only represent values from -9.99 to 9.99; decimal(5,2) allows up to
999.99. Pushing will silently cap or error on any value outside the smaller range.

**Action:** Run `SELECT MIN(extractionConfidence), MAX(extractionConfidence)
FROM drawingDataExtractions WHERE extractionConfidence IS NOT NULL` before pushing.
If all values fit in decimal(3,2), safe. Otherwise, widen schema.ts to decimal(5,2).
Treat this as high-risk until data is verified.

---

### 6. NOT NULL constraints — SAFE BUT NOISY
| Table | Column | DB type | schema.ts type | Null count |
|---|---|---|---|---|
| complianceAuditTrail | details | text | text notNull | 0/all rows |
| complianceAuditTrail | userEmail | varchar(320) | varchar(320) notNull | 0/all rows |

schema.ts is stricter than the DB (NOT NULL in schema, nullable in DB). There are zero
NULL values in live data. Pushing will ADD a NOT NULL constraint to these columns,
which requires a full table scan/rewrite in MySQL and will block briefly on large tables.

**Action:** Safe to push whenever convenient. Verify row count first to estimate lock time.

---

## How to proceed

1. For each item above, run the recommended data check query against Railway.
2. Fix schema.ts to match DB reality (or confirm DB can safely be altered to match schema.ts).
3. Run `! npx drizzle-kit push` interactively in the terminal — answer each prompt explicitly.
4. When drizzle-kit asks about homeReports.reportToken unique constraint: answer **No** to
   table truncation (the constraint can be added without truncation; drizzle-kit is being
   overly cautious).
5. Do NOT run drizzle-kit push non-interactively (`npx drizzle-kit push 2>&1` piped to a
   file) — the TTY requirement is load-bearing for this codebase's current drift level.
