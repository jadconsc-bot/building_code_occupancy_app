CREATE TABLE IF NOT EXISTS `vectorPaths` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pageId` int NOT NULL,
  `drawingAnalysisId` int NOT NULL,
  `pathType` enum('line','polyline','rect','curve') NOT NULL,
  `strokeWidth` decimal(6,3),
  `strokeColor` varchar(20),
  `fillColor` varchar(20),
  `pathDataJson` json NOT NULL,
  `boundingBoxJson` json,
  `pdfSpaceWidth` decimal(10,3),
  `pdfSpaceHeight` decimal(10,3),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_vp_pageId` (`pageId`),
  INDEX `idx_vp_analysisId` (`drawingAnalysisId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wallSegments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pageId` int NOT NULL,
  `drawingAnalysisId` int NOT NULL,
  `startX` decimal(10,3) NOT NULL,
  `startY` decimal(10,3) NOT NULL,
  `endX` decimal(10,3) NOT NULL,
  `endY` decimal(10,3) NOT NULL,
  `thicknessPx` decimal(6,3),
  `lengthPx` decimal(10,3),
  `orientation` enum('horizontal','vertical','diagonal'),
  `confidence` decimal(4,3) DEFAULT 1.000,
  `source` enum('vector','raster','manual') DEFAULT 'vector',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ws_pageId` (`pageId`),
  INDEX `idx_ws_analysisId` (`drawingAnalysisId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `doorOpenings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pageId` int NOT NULL,
  `drawingAnalysisId` int NOT NULL,
  `centerX` decimal(10,3) NOT NULL,
  `centerY` decimal(10,3) NOT NULL,
  `widthPx` decimal(8,3),
  `angle` decimal(6,2),
  `wallSegmentId` int,
  `detectedFeatureId` int,
  `confidence` decimal(4,3) DEFAULT 1.000,
  `source` enum('vector','feature_match','manual') DEFAULT 'vector',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_do_pageId` (`pageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `drawingPages`
  ADD COLUMN `vectorExtracted` tinyint(1) DEFAULT 0 AFTER `cropRegionSetAt`,
  ADD COLUMN `vectorExtractedAt` timestamp NULL AFTER `vectorExtracted`,
  ADD COLUMN `wallSegmentCount` int DEFAULT 0 AFTER `vectorExtractedAt`,
  ADD COLUMN `vectorExtractionSource` enum('pdf_paths','raster_fallback','none') DEFAULT 'none' AFTER `wallSegmentCount`;
