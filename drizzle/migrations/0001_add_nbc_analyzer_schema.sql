-- Migration: Add NBC Drawing Analyzer Schema
-- Date: 2026-03-15
-- Purpose: Add legal defensibility, immutability, and audit trail fields for drawing analysis

-- 1. Update drawingAnalyses table with immutability and disclaimer fields
ALTER TABLE `drawingAnalyses` ADD COLUMN (
  `drawingHash` VARCHAR(64) NOT NULL AFTER `drawingUrl` COMMENT 'SHA-256 hash of drawing file at upload time',
  `drawingSnapshotKey` VARCHAR(500) AFTER `drawingHash` COMMENT 'S3 key of immutable drawing snapshot (never overwritten)',
  `drawingSnapshotMimeType` VARCHAR(50) AFTER `drawingSnapshotKey` COMMENT 'MIME type of snapshot (application/pdf, image/jpeg, etc)',
  `drawingSnapshotSize` INT AFTER `drawingSnapshotMimeType` COMMENT 'Size in bytes of snapshot'
);

-- Add analysis status tracking
ALTER TABLE `drawingAnalyses` ADD COLUMN (
  `analysisStatus` ENUM('DRAFT', 'UNDER_REVIEW', 'VALID', 'REJECTED') NOT NULL DEFAULT 'DRAFT' AFTER `recommendations` COMMENT 'DRAFT=AI analysis complete, UNDER_REVIEW=professional review initiated, VALID=accepted and signed, REJECTED=rejected by professional'
);

-- Add disclaimer acknowledgment tracking
ALTER TABLE `drawingAnalyses` ADD COLUMN (
  `disclaimerAcknowledged` BOOLEAN NOT NULL DEFAULT FALSE AFTER `analysisStatus` COMMENT 'User acknowledged disclaimer before upload',
  `disclaimerAcknowledgedAt` TIMESTAMP AFTER `disclaimerAcknowledged` COMMENT 'Server-side UTC timestamp when disclaimer was acknowledged',
  `disclaimerVersion` VARCHAR(20) NOT NULL AFTER `disclaimerAcknowledgedAt` COMMENT 'Version of disclaimer text acknowledged by user'
);

-- Add LLM and rule engine versioning
ALTER TABLE `drawingAnalyses` ADD COLUMN (
  `llmModelVersion` VARCHAR(50) AFTER `disclaimerVersion` COMMENT 'Version of Claude model used for drawing extraction',
  `ruleEngineVersion` VARCHAR(20) AFTER `llmModelVersion` COMMENT 'Version of ComplianceEngine used for evaluation'
);

-- Add professional validation fields
ALTER TABLE `drawingAnalyses` ADD COLUMN (
  `validatedAt` TIMESTAMP AFTER `ruleEngineVersion` COMMENT 'Server-side UTC timestamp when professional accepted analysis',
  `validatedByUserId` INT AFTER `validatedAt` COMMENT 'FK to users table - professional who validated',
  `validatedByLicenseNumber` VARCHAR(100) AFTER `validatedByUserId` COMMENT 'Professional license number (P.Eng., Architect, etc)',
  `validatedByAssociation` VARCHAR(100) AFTER `validatedByLicenseNumber` COMMENT 'Professional association (APEGA, AIBC, PEO, EGBC, etc)'
);

-- Add indexes for query performance
ALTER TABLE `drawingAnalyses` ADD INDEX `idx_analysisStatus` (`analysisStatus`);
ALTER TABLE `drawingAnalyses` ADD INDEX `idx_disclaimerAcknowledged` (`disclaimerAcknowledged`);
ALTER TABLE `drawingAnalyses` ADD INDEX `idx_validatedAt` (`validatedAt`);
ALTER TABLE `drawingAnalyses` ADD INDEX `idx_drawingHash` (`drawingHash`);

-- Add foreign key for validated by user
ALTER TABLE `drawingAnalyses` ADD CONSTRAINT `fk_validatedByUserId` FOREIGN KEY (`validatedByUserId`) REFERENCES `users`(`id`);

-- 2. Update complianceAuditTrail table with credential capture fields
ALTER TABLE `complianceAuditTrail` ADD COLUMN (
  `userEmail` VARCHAR(255) NOT NULL AFTER `userId` COMMENT 'Verified email address from user profile',
  `userFullName` VARCHAR(255) AFTER `userEmail` COMMENT 'Full name as registered in CodeComply',
  `professionalLicenseNumber` VARCHAR(100) AFTER `userFullName` COMMENT 'License number (P.Eng., Architect, etc) - required for professional events',
  `professionalAssociation` VARCHAR(100) AFTER `professionalLicenseNumber` COMMENT 'Professional association (APEGA, AIBC, PEO, EGBC, etc)',
  `jurisdiction` VARCHAR(100) AFTER `professionalAssociation` COMMENT 'Province/territory of practice',
  `ipAddress` VARCHAR(45) AFTER `jurisdiction` COMMENT 'IPv4 or IPv6 address - supports IPv6',
  `userAgent` TEXT AFTER `ipAddress` COMMENT 'Browser/device fingerprint from HTTP headers',
  `sessionId` VARCHAR(255) AFTER `userAgent` COMMENT 'Session identifier linking actions within a session'
);

-- Add indexes for audit trail queries
ALTER TABLE `complianceAuditTrail` ADD INDEX `idx_userEmail` (`userEmail`);
ALTER TABLE `complianceAuditTrail` ADD INDEX `idx_professionalLicenseNumber` (`professionalLicenseNumber`);
ALTER TABLE `complianceAuditTrail` ADD INDEX `idx_jurisdiction` (`jurisdiction`);
ALTER TABLE `complianceAuditTrail` ADD INDEX `idx_sessionId` (`sessionId`);
ALTER TABLE `complianceAuditTrail` ADD INDEX `idx_action` (`action`);

-- 3. Create nbcRules table for versioned rules
CREATE TABLE `nbcRules` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ruleId` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique identifier (e.g., NBC-3.1.5.1)',
  `section` VARCHAR(20) NOT NULL COMMENT 'NBC section number (e.g., 3.1.5.1)',
  `clause` VARCHAR(100) NOT NULL COMMENT 'Clause description',
  `description` TEXT NOT NULL COMMENT 'Full text of the rule requirement',
  `category` ENUM('structural', 'fire-safety', 'connections', 'materials', 'csa') NOT NULL COMMENT 'Rule category for filtering',
  `jurisdiction` VARCHAR(50) COMMENT 'Jurisdiction (national, AB, BC, ON, etc)',
  `ruleVersion` INT NOT NULL DEFAULT 1 COMMENT 'Version number for rule changes',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether rule is currently active',
  `requiredFields` JSON COMMENT 'Required DrawingData fields for this rule',
  `evaluationLogic` VARCHAR(500) COMMENT 'Description of evaluation logic',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdByUserId` INT COMMENT 'FK to users - who created/imported rule',
  UNIQUE KEY `uk_ruleId_version` (`ruleId`, `ruleVersion`),
  INDEX `idx_section` (`section`),
  INDEX `idx_category` (`category`),
  INDEX `idx_jurisdiction` (`jurisdiction`),
  INDEX `idx_isActive` (`isActive`),
  FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`)
);

-- 4. Create disclaimerAcknowledgments table
CREATE TABLE `disclaimerAcknowledgments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `disclaimerVersion` VARCHAR(20) NOT NULL,
  `disclaimerText` TEXT NOT NULL COMMENT 'Full text of disclaimer acknowledged',
  `acknowledgedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Server-side UTC timestamp',
  `ipAddress` VARCHAR(45),
  `userAgent` TEXT,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_acknowledgedAt` (`acknowledgedAt`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

-- 5. Create drawingDataExtractions table for LLM extraction results
CREATE TABLE `drawingDataExtractions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `analysisId` INT NOT NULL,
  `extractedData` JSON NOT NULL COMMENT 'Structured DrawingData extracted by LLM',
  `extractionModel` VARCHAR(50) NOT NULL COMMENT 'Claude model version used',
  `extractionPromptVersion` VARCHAR(20) NOT NULL COMMENT 'Version of extraction prompt',
  `extractionConfidence` DECIMAL(3,2) COMMENT 'Confidence score of extraction (0.0-1.0)',
  `extractedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `INDEX idx_analysisId` (`analysisId`),
  `FOREIGN KEY (analysisId) REFERENCES drawingAnalyses(id)`
);

-- 6. Create complianceEvaluationResults table for rule engine results
CREATE TABLE `complianceEvaluationResults` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `analysisId` INT NOT NULL,
  `ruleId` INT NOT NULL,
  `ruleVersion` INT NOT NULL,
  `evaluationResult` ENUM('PASS', 'FAIL', 'CONDITIONAL', 'UNABLE_TO_EVALUATE') NOT NULL,
  `evaluationDetails` JSON COMMENT 'Detailed evaluation results',
  `evaluatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `INDEX idx_analysisId` (`analysisId`),
  `INDEX idx_ruleId` (`ruleId`),
  `FOREIGN KEY (analysisId) REFERENCES drawingAnalyses(id)`,
  `FOREIGN KEY (ruleId) REFERENCES nbcRules(id)`
);
