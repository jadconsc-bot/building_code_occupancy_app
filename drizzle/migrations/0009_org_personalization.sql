-- Migration: 0009_org_personalization
-- Org-Level Personalization Delta
-- Applied: 2026-05-25

-- New organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  planTier ENUM('basic','professional','enterprise') NOT NULL DEFAULT 'professional',
  trainingExampleCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
);

-- Add orgId to users (keep existing organization varchar as display name)
ALTER TABLE users
  ADD COLUMN orgId INT NULL AFTER role,
  ADD INDEX idx_orgId (orgId);
