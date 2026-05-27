-- Migration: Add org_admin to users role enum
-- Date: 2026-05-26
-- Rev 2 Fix 4: role = 'org_admin' replaces isOrgAdmin boolean column

ALTER TABLE users MODIFY COLUMN role
  ENUM('free','basic','professional','rule_editor','admin','org_admin')
  NOT NULL DEFAULT 'free';
