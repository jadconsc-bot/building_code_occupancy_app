ALTER TABLE siteAnalyses
  ADD COLUMN accessoryWidthM      DECIMAL(8,2) NULL,
  ADD COLUMN accessoryDepthM      DECIMAL(8,2) NULL,
  ADD COLUMN accessoryHeightM     DECIMAL(8,2) NULL,
  ADD COLUMN accessoryAreaSqm     DECIMAL(8,2) NULL,
  ADD COLUMN accessoryIsCompliant BOOLEAN NULL;
