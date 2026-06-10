-- Migration 0034: Add stack planner FRR data to projects
ALTER TABLE projects
  ADD COLUMN stackSeparationsJson JSON NULL,
  ADD COLUMN stackWingsJson JSON NULL,
  ADD COLUMN stackConfirmedAt DATETIME NULL;
