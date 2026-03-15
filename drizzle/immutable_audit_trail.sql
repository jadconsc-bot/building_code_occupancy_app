-- Migration: Enforce Immutable Audit Trail
-- Date: 2026-03-15
-- Purpose: Add database-level constraints to prevent UPDATE/DELETE on complianceAuditTrail
-- 
-- This migration implements legal defensibility by making the audit trail immutable
-- at the database layer. Even database administrators cannot modify audit records.

-- Step 1: Create trigger to prevent UPDATE operations
CREATE TRIGGER prevent_audit_trail_update
BEFORE UPDATE ON complianceAuditTrail
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' 
  SET MESSAGE_TEXT = 'Audit trail records are immutable and cannot be updated';
END;

-- Step 2: Create trigger to prevent DELETE operations
CREATE TRIGGER prevent_audit_trail_delete
BEFORE DELETE ON complianceAuditTrail
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' 
  SET MESSAGE_TEXT = 'Audit trail records are immutable and cannot be deleted';
END;

-- Step 3: Add comment documenting immutability
ALTER TABLE complianceAuditTrail COMMENT = 'IMMUTABLE AUDIT TRAIL - INSERT ONLY, NO UPDATE/DELETE PERMITTED';

-- Step 4: Verify triggers are in place
-- SELECT TRIGGER_SCHEMA, TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
-- FROM INFORMATION_SCHEMA.TRIGGERS
-- WHERE EVENT_OBJECT_TABLE = 'complianceAuditTrail'
-- AND TRIGGER_SCHEMA = DATABASE();
