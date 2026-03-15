-- Migration: Add Drawing Analysis Tables
-- Date: 2026-03-15
-- Purpose: Add tables for NBC drawing analyzer feature with legal defensibility and audit trail

-- 1. Create drawingAnalyses table
CREATE TABLE `drawingAnalyses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `drawingUrl` text NOT NULL,
  `drawingHash` varchar(64) NOT NULL COMMENT 'SHA-256 hash of drawing file',
  `drawingSnapshotKey` varchar(500) COMMENT 'S3 key for immutable snapshot',
  `drawingSnapshotMimeType` varchar(50) COMMENT 'MIME type of snapshot',
  `drawingSnapshotSize` int COMMENT 'File size in bytes',
  `analysisType` enum('structural','fire-safety','connections','comprehensive'),
  `analysisStatus` enum('DRAFT','UNDER_REVIEW','VALID','REJECTED') NOT NULL DEFAULT 'DRAFT',
  `complianceScore` int COMMENT '0-100 score',
  `complianceLevel` enum('approved','conditional','revision','rejected'),
  `structuralStatus` text COMMENT 'JSON results',
  `fireSafetyStatus` text COMMENT 'JSON results',
  `connectionStatus` text COMMENT 'JSON results',
  `issues` text COMMENT 'JSON array',
  `recommendations` text COMMENT 'JSON array',
  `disclaimerAcknowledged` boolean NOT NULL DEFAULT false,
  `disclaimerAcknowledgedAt` timestamp NULL,
  `disclaimerVersion` varchar(20) NOT NULL,
  `llmModelVersion` varchar(50) COMMENT 'e.g., claude-vision-4',
  `ruleEngineVersion` varchar(20) COMMENT 'e.g., 1.0',
  `validatedAt` timestamp NULL,
  `validatedByUserId` int,
  `validatedByLicenseNumber` varchar(100),
  `validatedByAssociation` varchar(100) COMMENT 'e.g., APEGA, AIBC',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `drawingAnalyses_id` PRIMARY KEY(`id`),
  INDEX `idx_analysisStatus` (`analysisStatus`),
  INDEX `idx_disclaimerAcknowledged` (`disclaimerAcknowledged`),
  INDEX `idx_validatedAt` (`validatedAt`),
  INDEX `idx_drawingHash` (`drawingHash`),
  INDEX `idx_projectId` (`projectId`),
  INDEX `idx_userId` (`userId`),
  CONSTRAINT `fk_validatedByUserId` FOREIGN KEY (`validatedByUserId`) REFERENCES `users`(`id`)
);

-- 2. Create drawingDataExtractions table
CREATE TABLE `drawingDataExtractions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `analysisId` int NOT NULL,
  `extractedData` text NOT NULL COMMENT 'JSON - structured DrawingData',
  `extractionModel` varchar(50) NOT NULL COMMENT 'e.g., claude-vision-4',
  `extractionPromptVersion` varchar(20) NOT NULL,
  `extractionConfidence` decimal(3,2) COMMENT '0.0-1.0',
  `extractedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `drawingDataExtractions_id` PRIMARY KEY(`id`),
  INDEX `idx_analysisId` (`analysisId`),
  FOREIGN KEY (`analysisId`) REFERENCES `drawingAnalyses`(`id`)
);

-- 3. Create nbcRules table
CREATE TABLE `nbcRules` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ruleId` varchar(50) NOT NULL UNIQUE COMMENT 'e.g., NBC-3.1.5.1',
  `section` varchar(20) NOT NULL COMMENT 'e.g., 3.1.5.1',
  `clause` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `category` enum('structural','fire-safety','connections','materials','csa') NOT NULL,
  `jurisdiction` varchar(50) COMMENT 'e.g., national, AB, BC, ON',
  `ruleVersion` int NOT NULL DEFAULT 1,
  `isActive` boolean NOT NULL DEFAULT true,
  `requiredFields` text COMMENT 'JSON array',
  `evaluationLogic` varchar(500) COMMENT 'Description of evaluation logic',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdByUserId` int,
  CONSTRAINT `nbcRules_id` PRIMARY KEY(`id`),
  UNIQUE KEY `uk_ruleId_version` (`ruleId`, `ruleVersion`),
  INDEX `idx_section` (`section`),
  INDEX `idx_category` (`category`),
  INDEX `idx_jurisdiction` (`jurisdiction`),
  INDEX `idx_isActive` (`isActive`),
  FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`)
);

-- 4. Create complianceEvaluationResults table
CREATE TABLE `complianceEvaluationResults` (
  `id` int AUTO_INCREMENT NOT NULL,
  `analysisId` int NOT NULL,
  `ruleId` int NOT NULL,
  `ruleVersion` int NOT NULL,
  `evaluationResult` enum('PASS','FAIL','CONDITIONAL','UNABLE_TO_EVALUATE') NOT NULL,
  `evaluationDetails` text COMMENT 'JSON with evaluation details',
  `evaluatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `complianceEvaluationResults_id` PRIMARY KEY(`id`),
  INDEX `idx_analysisId` (`analysisId`),
  INDEX `idx_ruleId` (`ruleId`),
  FOREIGN KEY (`analysisId`) REFERENCES `drawingAnalyses`(`id`),
  FOREIGN KEY (`ruleId`) REFERENCES `nbcRules`(`id`)
);

-- 5. Create complianceAuditTrail table (IMMUTABLE)
CREATE TABLE `complianceAuditTrail` (
  `id` int AUTO_INCREMENT NOT NULL,
  `analysisId` int NOT NULL,
  `userId` int NOT NULL,
  `action` varchar(100) NOT NULL COMMENT 'e.g., DRAWING_UPLOADED, EXTRACTION_COMPLETED',
  `details` text NOT NULL COMMENT 'JSON with action details',
  `userEmail` varchar(255) NOT NULL,
  `userFullName` varchar(255),
  `professionalLicenseNumber` varchar(100) COMMENT 'For professional review events',
  `professionalAssociation` varchar(100) COMMENT 'e.g., APEGA, AIBC',
  `jurisdiction` varchar(100) COMMENT 'Province/territory',
  `ipAddress` varchar(45) COMMENT 'IPv4 or IPv6',
  `userAgent` text COMMENT 'Browser/device fingerprint',
  `sessionId` varchar(255) COMMENT 'Session identifier',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `complianceAuditTrail_id` PRIMARY KEY(`id`),
  INDEX `idx_analysisId` (`analysisId`),
  INDEX `idx_userEmail` (`userEmail`),
  INDEX `idx_professionalLicenseNumber` (`professionalLicenseNumber`),
  INDEX `idx_jurisdiction` (`jurisdiction`),
  INDEX `idx_sessionId` (`sessionId`),
  INDEX `idx_action` (`action`),
  INDEX `idx_timestamp` (`timestamp`),
  FOREIGN KEY (`analysisId`) REFERENCES `drawingAnalyses`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

-- 6. Create disclaimerAcknowledgments table
CREATE TABLE `disclaimerAcknowledgments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `disclaimerVersion` varchar(20) NOT NULL,
  `disclaimerText` text NOT NULL COMMENT 'Full text of disclaimer',
  `ipAddress` varchar(45),
  `userAgent` text,
  `acknowledgedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `disclaimerAcknowledgments_id` PRIMARY KEY(`id`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_acknowledgedAt` (`acknowledgedAt`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

-- CRITICAL: Enforce immutability on complianceAuditTrail at database layer
-- Note: In production, remove UPDATE and DELETE privileges from application user
-- REVOKE UPDATE, DELETE ON database.complianceAuditTrail FROM 'app_user'@'localhost';
