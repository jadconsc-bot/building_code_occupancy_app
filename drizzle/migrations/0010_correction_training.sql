-- Migration: 0010_correction_training
-- Phase 5B: Admin Correction UI + Training Loop
-- Applied: 2026-05-25

-- Full roomCorrections table (replaces stub — table did not exist in Railway)
CREATE TABLE IF NOT EXISTS roomCorrections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roomId INT NOT NULL,
  pageId INT NOT NULL,
  correctedBy INT NOT NULL,
  orgId INT NULL,
  correctedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  correctionType ENUM(
    'label_rename',
    'occupancy_change',
    'boundary_redraw',
    'false_positive_delete',
    'missing_room_add'
  ) NOT NULL,
  previousValueJson JSON,
  correctedValueJson JSON NOT NULL,
  planType VARCHAR(50),
  addedToTraining TINYINT(1) DEFAULT 1,
  trainingWeight DECIMAL(3,2) DEFAULT 1.00,
  notes TEXT,
  INDEX idx_roomId (roomId),
  INDEX idx_pageId (pageId),
  INDEX idx_correctionType (correctionType),
  INDEX idx_planType (planType),
  INDEX idx_addedToTraining (addedToTraining),
  INDEX idx_orgId (orgId)
);

-- Full trainingExamples table (replaces stub — table did not exist in Railway)
CREATE TABLE IF NOT EXISTS trainingExamples (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orgId INT NULL,
  planType VARCHAR(50) NOT NULL,
  correctionId INT NOT NULL,
  imageCropBase64 MEDIUMTEXT,
  promptContribution TEXT NOT NULL,
  isActive TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_planType (planType),
  INDEX idx_isActive (isActive),
  INDEX idx_orgId_planType (orgId, planType)
);

-- Polygon leak diagnostics + correction tracking on detectedRooms
ALTER TABLE detectedRooms
  ADD COLUMN polygonToBboxRatio DECIMAL(5,3) NULL AFTER polygonExtractedAt,
  ADD COLUMN polygonLeakSuspected TINYINT(1) DEFAULT 0 AFTER polygonToBboxRatio,
  ADD COLUMN correctionCount INT DEFAULT 0 AFTER polygonLeakSuspected,
  ADD COLUMN lastCorrectedAt TIMESTAMP NULL AFTER correctionCount;
