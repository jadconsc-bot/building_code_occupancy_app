-- Migration: 0003_immutable_audit_triggers.sql
-- Purpose: Enforce immutability on audit trail tables
-- Date: 2026-03-24
-- Description: Create triggers to prevent UPDATE and DELETE operations on critical audit tables

-- ============================================================================
-- COMPLIANCE AUDIT TRAIL - IMMUTABILITY TRIGGERS
-- ============================================================================

-- Prevent UPDATE on complianceAuditTrail
CREATE TRIGGER prevent_complianceAuditTrail_update
BEFORE UPDATE ON complianceAuditTrail
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Audit trail records are immutable and cannot be modified';
END;

-- Prevent DELETE on complianceAuditTrail
CREATE TRIGGER prevent_complianceAuditTrail_delete
BEFORE DELETE ON complianceAuditTrail
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Audit trail records are immutable and cannot be deleted';
END;

-- ============================================================================
-- DISCLAIMER ACKNOWLEDGMENTS - IMMUTABILITY TRIGGERS
-- ============================================================================

-- Prevent UPDATE on disclaimerAcknowledgments
CREATE TRIGGER prevent_disclaimerAcknowledgments_update
BEFORE UPDATE ON disclaimerAcknowledgments
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Disclaimer acknowledgments are immutable and cannot be modified';
END;

-- Prevent DELETE on disclaimerAcknowledgments
CREATE TRIGGER prevent_disclaimerAcknowledgments_delete
BEFORE DELETE ON disclaimerAcknowledgments
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Disclaimer acknowledgments are immutable and cannot be deleted';
END;

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================

-- Test UPDATE prevention:
-- UPDATE complianceAuditTrail SET action = 'MODIFIED' WHERE id = 1;
-- Expected: Error - "Audit trail records are immutable and cannot be modified"

-- Test DELETE prevention:
-- DELETE FROM complianceAuditTrail WHERE id = 1;
-- Expected: Error - "Audit trail records are immutable and cannot be deleted"

-- Test INSERT still works:
-- INSERT INTO complianceAuditTrail (analysisId, action, ...) VALUES (...);
-- Expected: Success

-- ============================================================================
-- NOTES
-- ============================================================================
-- These triggers ensure that:
-- 1. Audit trail cannot be tampered with after creation
-- 2. Legal defensibility is maintained
-- 3. All audit events are permanent and unmodifiable
-- 4. Compliance requirements are met
-- ============================================================================
