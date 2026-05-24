-- Compliance Intelligence Monitoring Agent
-- Phase 4 Item 3

CREATE TABLE IF NOT EXISTS complianceMonitorSnapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sourceId VARCHAR(20) NOT NULL,
  sourceUrl VARCHAR(500) NOT NULL,
  contentHash VARCHAR(64) NOT NULL,
  contentSample TEXT,
  fetchedAt DATETIME NOT NULL,
  httpStatus INT,
  errorMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sourceId_snap (sourceId),
  INDEX idx_fetchedAt_snap (fetchedAt)
);

CREATE TABLE IF NOT EXISTS complianceNotifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sourceId VARCHAR(20) NOT NULL,
  sourceUrl VARCHAR(500) NOT NULL,
  changeDetectedAt DATETIME NOT NULL,
  headline VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL,
  affectedRuleIds JSON,
  recommendedActions JSON,
  severity ENUM('critical','major','minor','info') NOT NULL DEFAULT 'info',
  status ENUM('pending','reviewed','actioned','dismissed') NOT NULL DEFAULT 'pending',
  reviewedBy INT,
  reviewedAt DATETIME,
  reviewNotes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status_notif (status),
  INDEX idx_sourceId_notif (sourceId),
  INDEX idx_severity_notif (severity)
);
