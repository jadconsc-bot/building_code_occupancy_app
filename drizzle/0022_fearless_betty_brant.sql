CREATE TABLE `apsConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`apsAccountId` varchar(100),
	`companyName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apsConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bcProjectLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bcProjectId` varchar(100) NOT NULL,
	`bcProjectName` varchar(200),
	`apsProjectId` varchar(100),
	`codeComplyProjectId` int,
	`autoCheckEnabled` tinyint NOT NULL DEFAULT 1,
	`lastCheckedAt` timestamp,
	`lastReportId` varchar(200),
	`issueCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bcProjectLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculationsPackages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`orgId` int,
	`createdBy` int NOT NULL,
	`drawingAnalysisId` int,
	`codeStrategyId` int,
	`province` varchar(5) NOT NULL,
	`codeEdition` varchar(20) NOT NULL,
	`sprinklered` tinyint DEFAULT 0,
	`occupantLoadByGroup` json,
	`totalOccupantLoad` int,
	`exitWidthRequiredMm` decimal(8,2),
	`travelDistanceResults` json,
	`areaByFloor` json,
	`totalAreaM2` decimal(10,2),
	`nbcTableRef` varchar(50),
	`calculationsSummaryJson` json,
	`approvedBy` int,
	`approvedAt` timestamp,
	`status` enum('draft','approved','superseded') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calculationsPackages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codeStrategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`orgId` int,
	`createdBy` int NOT NULL,
	`province` varchar(5) NOT NULL,
	`codeEdition` varchar(20) NOT NULL,
	`constructionType` varchar(10) NOT NULL,
	`sprinklered` tinyint DEFAULT 0,
	`buildingHeightM` decimal(6,2),
	`buildingAreaM2` decimal(10,2),
	`storeys` int,
	`occupancyGroups` json,
	`egressStrategy` text,
	`exitCount` int,
	`separationRequired` tinyint DEFAULT 0,
	`strategySummaryJson` json,
	`approvedBy` int,
	`approvedAt` timestamp,
	`status` enum('draft','approved','superseded') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codeStrategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceMonitorSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(20) NOT NULL,
	`sourceUrl` varchar(500) NOT NULL,
	`contentHash` varchar(64) NOT NULL,
	`contentSample` text,
	`fetchedAt` timestamp NOT NULL,
	`httpStatus` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceMonitorSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(20) NOT NULL,
	`sourceUrl` varchar(500) NOT NULL,
	`changeDetectedAt` timestamp NOT NULL,
	`headline` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`affectedRuleIds` json,
	`recommendedActions` json,
	`severity` enum('critical','major','minor','info') NOT NULL DEFAULT 'info',
	`status` enum('pending','reviewed','actioned','dismissed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`roomId` int,
	`ruleReference` varchar(50) NOT NULL,
	`ruleCategory` varchar(50) NOT NULL,
	`ruleText` text NOT NULL,
	`status` enum('pass','fail','warning','not_applicable') NOT NULL,
	`actualValue` varchar(100),
	`requiredValue` varchar(100),
	`remediationSuggestion` text,
	`confidence` decimal(3,2),
	`severity` varchar(20),
	`constraintId` varchar(100),
	`overrideChain` json,
	`checkedAt` timestamp DEFAULT (now()),
	CONSTRAINT `complianceResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `detectedFeatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`featureType` varchar(100) NOT NULL,
	`positionJson` text NOT NULL,
	`confidence` decimal(4,3) NOT NULL,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `detectedFeatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `detectedRooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`projectId` int NOT NULL,
	`roomLabel` varchar(255),
	`boundingBoxJson` text NOT NULL,
	`polygonJson` json,
	`polygonSource` enum('flood_fill','fallback_bbox','manual','dda_ray_cast','roboflow_segmentation'),
	`polygonExtractedAt` timestamp,
	`polygonToBboxRatio` decimal(5,3),
	`polygonLeakSuspected` tinyint DEFAULT 0,
	`correctionCount` int DEFAULT 0,
	`lastCorrectedAt` timestamp,
	`areaSqm` decimal(10,2),
	`floorLevel` varchar(100),
	`occupancyGroup` varchar(10),
	`occupancyDivision` int,
	`confidence` decimal(4,3) NOT NULL,
	`flagsJson` text,
	`flaggedForReview` tinyint NOT NULL DEFAULT 0,
	`manualOverride` tinyint NOT NULL DEFAULT 0,
	`seedX` float,
	`seedY` float,
	`doorBarriersJson` json,
	`detectionMethod` enum('flood_fill','dda_ray_cast','manual','fallback_bbox') NOT NULL DEFAULT 'flood_fill',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `detectedRooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doorOpenings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`drawingAnalysisId` int NOT NULL,
	`centerX` decimal(10,3) NOT NULL,
	`centerY` decimal(10,3) NOT NULL,
	`widthPx` decimal(8,3),
	`angle` decimal(6,2),
	`wallSegmentId` int,
	`detectedFeatureId` int,
	`confidence` decimal(4,3) DEFAULT '1.000',
	`source` enum('vector','feature_match','manual') DEFAULT 'vector',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `doorOpenings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drawingPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawingId` int NOT NULL,
	`pageNumber` int NOT NULL,
	`widthPx` int NOT NULL,
	`heightPx` int NOT NULL,
	`preprocessedUrl` varchar(500),
	`cropRegionJson` json,
	`cropRegionInheritedFrom` int,
	`cropRegionSetAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`evalAccuracy` decimal(4,3),
	`evalPassingRooms` int,
	`evalTotalRooms` int,
	`evalMissedRoomsJson` text,
	`detectedScale` varchar(100),
	`calibrationScale` decimal(12,6),
	`vectorExtracted` tinyint DEFAULT 0,
	`vectorExtractedAt` timestamp,
	`wallSegmentCount` int DEFAULT 0,
	`vectorExtractionSource` enum('pdf_paths','raster_fallback','none') DEFAULT 'none',
	CONSTRAINT `drawingPages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drawingSetContexts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`drawingAnalysisId` int NOT NULL DEFAULT 0,
	`projectName` varchar(200),
	`projectAddress` varchar(300),
	`architectFirm` varchar(200),
	`clientName` varchar(200),
	`buildingOccupancy` varchar(50),
	`numberOfStoreys` int,
	`constructionType` varchar(100),
	`sprinklered` tinyint DEFAULT 0,
	`basementPresent` tinyint DEFAULT 0,
	`codeEdition` varchar(50),
	`municipality` varchar(100),
	`province` varchar(5),
	`totalPages` int,
	`pageInventoryJson` json,
	`floorHierarchyJson` json,
	`confirmedScale` varchar(50),
	`overallWidthM` decimal(8,2),
	`overallDepthM` decimal(8,2),
	`typicalCeilingHeightM` decimal(6,2),
	`abbreviationsJson` json,
	`exitLocationsJson` json,
	`stairLocationsJson` json,
	`doorScheduleJson` json,
	`windowScheduleJson` json,
	`schedulePageNumbers` json,
	`totalDoorTypes` int DEFAULT 0,
	`totalWindowTypes` int DEFAULT 0,
	`currentRevision` varchar(20),
	`revisionDate` date,
	`rawContextJson` json,
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	`extractedBy` int,
	CONSTRAINT `drawingSetContexts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fireAssemblies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawingAnalysisId` int NOT NULL,
	`pageId` int NOT NULL,
	`projectId` int NOT NULL,
	`assemblyType` enum('none','0.5hr','1hr','1.5hr','2hr','fire_separation') NOT NULL,
	`frrDrawn` decimal(4,2) NOT NULL,
	`frrRequired` decimal(4,2),
	`isCompliant` boolean,
	`gap` decimal(4,2),
	`roomAId` int,
	`roomBId` int,
	`occupancyA` varchar(10),
	`occupancyB` varchar(10),
	`labelA` varchar(100),
	`labelB` varchar(100),
	`lengthPx` decimal(10,2),
	`lengthM` decimal(8,2),
	`wallHeightM` decimal(6,2) DEFAULT '2.74',
	`pointsJson` json NOT NULL,
	`nbcReference` varchar(50) DEFAULT 'NBC Table 3.1.3.4',
	`remediationJson` json,
	`assemblyLabel` varchar(10),
	`wallCode` varchar(30),
	`wallName` varchar(200),
	`sequenceNum` int NOT NULL DEFAULT 1,
	`isStacked` tinyint NOT NULL DEFAULT 0,
	`stackedWithId` int,
	`stackSuffix` varchar(1),
	`effectiveFrr` decimal(4,2),
	`wallCodeFormat` varchar(20) NOT NULL DEFAULT 'FW',
	`ulcDesign` varchar(50),
	`assemblyDesc` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fireAssemblies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `foundingMemberCounter` (
	`id` int AUTO_INCREMENT NOT NULL,
	`claimed` int NOT NULL DEFAULT 247,
	`cap` int NOT NULL DEFAULT 1000,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `foundingMemberCounter_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `homeReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportToken` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`userId` int,
	`province` enum('AB','BC','ON') NOT NULL,
	`municipality` varchar(100),
	`projectType` varchar(50) NOT NULL,
	`formAnswersJson` json NOT NULL,
	`complianceResultJson` json,
	`overallResult` enum('pass','conditional','fail'),
	`stripePaymentIntentId` varchar(100),
	`paymentStatus` enum('pending','paid','refunded') DEFAULT 'pending',
	`pdfStorageKey` varchar(500),
	`reportGeneratedAt` timestamp,
	`downloadExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `homeReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `homeReports_reportToken_unique` UNIQUE(`reportToken`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`planTier` enum('basic','professional','enterprise') NOT NULL DEFAULT 'professional',
	`trainingExampleCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permitReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`orgId` int NOT NULL,
	`reviewedBy` int NOT NULL,
	`reviewType` enum('code_strategy','calculations','permit_package') NOT NULL,
	`decision` enum('approved','revision_requested','rejected') NOT NULL,
	`notes` text,
	`submittedDate` date,
	`permitApplicationNumber` varchar(100),
	`reviewingAuthority` varchar(200),
	`submissionStatus` enum('not_submitted','submitted','under_review','approved','rejected') DEFAULT 'not_submitted',
	`permitNumber` varchar(100),
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permitReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roomCorrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`pageId` int NOT NULL,
	`correctedBy` int NOT NULL,
	`orgId` int,
	`correctedAt` timestamp NOT NULL DEFAULT (now()),
	`correctionType` enum('label_rename','occupancy_change','boundary_redraw','false_positive_delete','missing_room_add') NOT NULL,
	`previousValueJson` json,
	`correctedValueJson` json NOT NULL,
	`planType` varchar(50),
	`addedToTraining` tinyint DEFAULT 1,
	`trainingWeight` decimal(3,2) DEFAULT '1.00',
	`notes` text,
	CONSTRAINT `roomCorrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`lotWidthM` decimal(8,2),
	`lotDepthM` decimal(8,2),
	`lotAreaSqm` decimal(10,2),
	`buildingWidthM` decimal(8,2),
	`buildingDepthM` decimal(8,2),
	`buildingHeightM` decimal(8,2),
	`frontSetbackM` decimal(6,2),
	`rearSetbackM` decimal(6,2),
	`sideSetbackM` decimal(6,2),
	`siteCoveragePct` decimal(5,2),
	`isCompliant` boolean DEFAULT false,
	`zoneCode` varchar(50),
	`municipality` varchar(100),
	`accessoryWidthM` decimal(8,2),
	`accessoryDepthM` decimal(8,2),
	`accessoryHeightM` decimal(8,2),
	`accessoryAreaSqm` decimal(8,2),
	`accessoryIsCompliant` boolean,
	`source` varchar(50) DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamWaitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(50) DEFAULT 'billing_page',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamWaitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamWaitlist_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `trainingExamples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int,
	`planType` varchar(50) NOT NULL,
	`correctionId` int NOT NULL,
	`imageCropBase64` text,
	`promptContribution` text NOT NULL,
	`conventionType` enum('label_convention','symbol_convention','layout_convention','equipment_convention','occupancy_convention','correction') NOT NULL DEFAULT 'correction',
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`exportedAt` timestamp,
	`roboflowImageId` varchar(255),
	CONSTRAINT `trainingExamples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vectorPaths` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vectorPaths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`drawingAnalysisId` int NOT NULL,
	`startX` decimal(10,3) NOT NULL,
	`startY` decimal(10,3) NOT NULL,
	`endX` decimal(10,3) NOT NULL,
	`endY` decimal(10,3) NOT NULL,
	`thicknessPx` decimal(6,3),
	`lengthPx` decimal(10,3),
	`orientation` enum('horizontal','vertical','diagonal'),
	`confidence` decimal(4,3) DEFAULT '1.000',
	`source` enum('vector','raster','manual') DEFAULT 'vector',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `calculationAuditLog` MODIFY COLUMN `actor` int;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('free','home_user','basic','professional','rule_editor','admin','org_admin') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `calculationResults` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `drawingAnalyses` ADD `fileType` enum('pdf','dwg','png','jpeg');--> statement-breakpoint
ALTER TABLE `drawingAnalyses` ADD `pageCount` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `drawingAnalyses` ADD `uploadStatus` enum('pending','processing','complete','error') DEFAULT 'complete';--> statement-breakpoint
ALTER TABLE `projects` ADD `province` varchar(5);--> statement-breakpoint
ALTER TABLE `projects` ADD `climateZone` varchar(10);--> statement-breakpoint
ALTER TABLE `projects` ADD `seismicZone` varchar(20);--> statement-breakpoint
ALTER TABLE `projects` ADD `buildingType` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `stepCodeTier` varchar(5);--> statement-breakpoint
ALTER TABLE `projects` ADD `jurisdictionDetected` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `projects` ADD `projectCode` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `grossFloorArea` decimal(10,2);--> statement-breakpoint
ALTER TABLE `projects` ADD `projectNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `projects` ADD `codeEdition` varchar(20);--> statement-breakpoint
ALTER TABLE `projects` ADD `part3Determination` varchar(100);--> statement-breakpoint
ALTER TABLE `projects` ADD `constructionType` enum('combustible','non_combustible','mixed');--> statement-breakpoint
ALTER TABLE `projects` ADD `sprinklersRequired` tinyint;--> statement-breakpoint
ALTER TABLE `projects` ADD `zoningCategory` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `storeys` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `buildingHeight` decimal(6,2);--> statement-breakpoint
ALTER TABLE `projects` ADD `municipality` varchar(100);--> statement-breakpoint
ALTER TABLE `projects` ADD `zoneCode` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `zoneName` varchar(200);--> statement-breakpoint
ALTER TABLE `projects` ADD `zoneLookupSource` enum('manual','geocoded_calgary','geocoded_edmonton','geocoded_other') DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `projects` ADD `parcelLat` decimal(10,7);--> statement-breakpoint
ALTER TABLE `projects` ADD `parcelLng` decimal(10,7);--> statement-breakpoint
ALTER TABLE `projects` ADD `communityName` varchar(100);--> statement-breakpoint
ALTER TABLE `projects` ADD `zoneConfirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD `jurisdictionSource` enum('geocoded','manual','device','fallback') DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `projects` ADD `geocodedAt` datetime;--> statement-breakpoint
ALTER TABLE `projects` ADD `stackSeparationsJson` json;--> statement-breakpoint
ALTER TABLE `projects` ADD `stackWingsJson` json;--> statement-breakpoint
ALTER TABLE `projects` ADD `stackConfirmedAt` datetime;--> statement-breakpoint
ALTER TABLE `userSubscriptions` ADD `isFoundingMember` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userSubscriptions` ADD `homeReportsRemaining` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userSubscriptions` ADD `contractorPackPurchased` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `userSubscriptions` ADD `contractorPackPurchasedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `orgId` int;