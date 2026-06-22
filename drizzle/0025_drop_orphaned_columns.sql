-- Migration: drop orphaned DB columns not present in schema.ts
-- These columns exist in the live DB but were removed from schema.ts at some
-- earlier point. All 12 columns confirmed 0 non-null rows (except where noted)
-- and confirmed no active code reads or writes them via the ORM.
--
-- RECON results (2026-06-22):
--   detectedRooms.correctedBy    — 0/2266 non-null
--   detectedRooms.correctedAt    — 0/2266 non-null
--   drawingAnalyses.fileUrl      — 0/354  non-null
--   drawingDataExtractions.drawingType   — 0/271 non-null
--   drawingDataExtractions.jurisdiction  — 0/271 non-null
--   drawingDataExtractions.confidence    — 0/271 non-null
--   drawingDataExtractions.createdAt     — 271/271 non-null (legacy timestamp,
--                                          superseded by extractedAt; no code reads it)
--   projects.lat                 — 0/12  non-null
--   projects.lng                 — 0/12  non-null
--   projects.jurisdictionProfileId — 0/12 non-null
--   users.organization           — 0/8   non-null
--   users.userRole               — 8/8   non-null  (legacy; active column is users.role)
--
-- DO NOT execute until drizzle-kit push has been run against the updated
-- schema.ts (which no longer references any of these columns) and confirmed
-- that the schema diff only shows changes we expect.

ALTER TABLE `detectedRooms`
  DROP COLUMN `correctedBy`,
  DROP COLUMN `correctedAt`;

ALTER TABLE `drawingAnalyses`
  DROP COLUMN `fileUrl`;

ALTER TABLE `drawingDataExtractions`
  DROP COLUMN `drawingType`,
  DROP COLUMN `jurisdiction`,
  DROP COLUMN `confidence`,
  DROP COLUMN `createdAt`;

ALTER TABLE `projects`
  DROP COLUMN `lat`,
  DROP COLUMN `lng`,
  DROP COLUMN `jurisdictionProfileId`;

ALTER TABLE `users`
  DROP COLUMN `organization`,
  DROP COLUMN `userRole`;
