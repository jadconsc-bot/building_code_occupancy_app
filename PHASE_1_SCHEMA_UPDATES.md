# Phase 1: Mandatory Schema Updates

**Based On:** CodeComply Implementation Instructions (Senior Coder Review)  
**Status:** Ready for Migration  
**Follows:** CODING_PROTOCOL Database Migration Pattern

---

## Overview

Phase 1 requires three schema updates to support legal defensibility, professional accountability, and immutable audit trails. These updates are MANDATORY and must be completed before Phase 2 begins.

---

## Update 1: drawingAnalyses Table - Add Immutability & Disclaimer Fields

**Current Fields:** (from previous implementation)
```sql
CREATE TABLE drawingAnalyses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  drawingUrl TEXT NOT NULL,
  analysisType ENUM('structural', 'fire-safety', 'connections', 'comprehensive'),
  complianceScore INT,
  complianceLevel ENUM('approved', 'conditional', 'revision', 'rejected'),
  structuralStatus JSON,
  fireSafetyStatus JSON,
  connectionStatus JSON,
  issues JSON,
  recommendations JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**New Fields to Add:**

```sql
ALTER TABLE drawingAnalyses ADD COLUMN (
  -- Drawing Immutability (Critical Clarification 2)
  drawingHash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of drawing file at upload time',
  drawingSnapshotKey VARCHAR(500) COMMENT 'S3 key of immutable drawing snapshot (never overwritten)',
  drawingSnapshotMimeType VARCHAR(50) COMMENT 'MIME type of snapshot (application/pdf, image/jpeg, etc)',
  drawingSnapshotSize INT COMMENT 'Size in bytes of snapshot',
  
  -- Analysis Status Tracking (Mandatory Professional Review)
  analysisStatus ENUM('DRAFT', 'UNDER_REVIEW', 'VALID', 'REJECTED') 
    NOT NULL DEFAULT 'DRAFT' 
    COMMENT 'DRAFT=AI analysis complete, UNDER_REVIEW=professional review initiated, VALID=accepted and signed, REJECTED=rejected by professional',
  
  -- Disclaimer Acknowledgment (Mandatory Disclaimer Requirements)
  disclaimerAcknowledged BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT 'User acknowledged disclaimer before upload',
  disclaimerAcknowledgedAt TIMESTAMP 
    COMMENT 'Server-side UTC timestamp when disclaimer was acknowledged',
  disclaimerVersion VARCHAR(20) NOT NULL 
    COMMENT 'Version of disclaimer text acknowledged by user',
  
  -- LLM & Rule Engine Versioning (Two-Stage Pipeline)
  llmModelVersion VARCHAR(50) 
    COMMENT 'Version of Claude model used for drawing extraction',
  ruleEngineVersion VARCHAR(20) 
    COMMENT 'Version of ComplianceEngine used for evaluation',
  
  -- Professional Validation (Legal Defensibility)
  validatedAt TIMESTAMP 
    COMMENT 'Server-side UTC timestamp when professional accepted analysis',
  validatedByUserId INT 
    COMMENT 'FK to users table - professional who validated',
  validatedByLicenseNumber VARCHAR(100) 
    COMMENT 'Professional license number (P.Eng., Architect, etc)',
  validatedByAssociation VARCHAR(100) 
    COMMENT 'Professional association (APEGA, AIBC, PEO, EGBC, etc)',
  
  -- Audit Trail References
  INDEX idx_analysisStatus (analysisStatus),
  INDEX idx_disclaimerAcknowledged (disclaimerAcknowledged),
  INDEX idx_validatedAt (validatedAt),
  INDEX idx_drawingHash (drawingHash),
  FOREIGN KEY (validatedByUserId) REFERENCES users(id)
);
```

**Rationale:**

| Field | Purpose | Legal Defensibility |
|---|---|---|
| drawingHash | Verify drawing integrity | Proves exact drawing analyzed |
| drawingSnapshotKey | Immutable copy in S3 | Reconstruction for legal proceedings |
| analysisStatus | Track professional review | Prevents use of unreviewed analysis |
| disclaimerAcknowledged | Proof of user acknowledgment | Demonstrates informed consent |
| disclaimerVersion | Track disclaimer changes | Audit trail of terms accepted |
| llmModelVersion | Reproducibility | Can replay extraction with same model |
| ruleEngineVersion | Reproducibility | Can replay evaluation with same rules |
| validatedByLicenseNumber | Professional accountability | Links to licensed professional |
| validatedByAssociation | Professional jurisdiction | Verifies authority to practice |

---

## Update 2: complianceAuditTrail Table - Add Credential Capture

**Current Fields:** (from previous implementation)
```sql
CREATE TABLE complianceAuditTrail (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analysisId INT NOT NULL,
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSON NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysisId) REFERENCES drawingAnalyses(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (analysisId),
  INDEX (timestamp)
);
```

**New Fields to Add:**

```sql
ALTER TABLE complianceAuditTrail ADD COLUMN (
  -- User Credentials (Mandatory Audit Trail Requirements)
  userEmail VARCHAR(255) NOT NULL 
    COMMENT 'Verified email address from user profile',
  userFullName VARCHAR(255) 
    COMMENT 'Full name as registered in CodeComply',
  
  -- Professional Credentials (for professional review events)
  professionalLicenseNumber VARCHAR(100) 
    COMMENT 'License number (P.Eng., Architect, etc) - required for professional events',
  professionalAssociation VARCHAR(100) 
    COMMENT 'Professional association (APEGA, AIBC, PEO, EGBC, etc)',
  
  -- Jurisdiction & Context
  jurisdiction VARCHAR(100) 
    COMMENT 'Province/territory of practice',
  
  -- Request Context (Forensic Traceability)
  ipAddress VARCHAR(45) 
    COMMENT 'IPv4 or IPv6 address - supports IPv6',
  userAgent TEXT 
    COMMENT 'Browser/device fingerprint from HTTP headers',
  sessionId VARCHAR(255) 
    COMMENT 'Session identifier linking actions within a session',
  
  -- Timestamp (Server-side, NEVER client-side)
  -- timestamp field already exists, ensure it is server-generated
  
  -- Indexes for query performance
  INDEX idx_userEmail (userEmail),
  INDEX idx_professionalLicenseNumber (professionalLicenseNumber),
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_sessionId (sessionId),
  INDEX idx_action (action)
);

-- CRITICAL: Enforce immutability at database permission layer
-- Remove UPDATE and DELETE privileges on this table
-- (Implementation: Database user permissions, not application logic)
```

**Audit Events to Record (Section 5.2 of Instructions):**

| Event | Action Code | Credentials Captured |
|---|---|---|
| Disclaimer acknowledged | DISCLAIMER_ACKNOWLEDGED | Full set |
| Drawing uploaded | DRAWING_UPLOADED | userId, email, timestamp, hash |
| Analysis initiated | ANALYSIS_INITIATED | Full set |
| LLM extraction completed | EXTRACTION_COMPLETED | userId, analysisId, model version |
| Rule engine evaluation completed | EVALUATION_COMPLETED | userId, analysisId, ruleVersion |
| Compliance score calculated | SCORE_CALCULATED | userId, score, level |
| Analysis viewed by user | ANALYSIS_VIEWED | userId, ip, userAgent, timestamp |
| Professional review initiated | PROFESSIONAL_REVIEW_INITIATED | Full set + license number |
| Analysis accepted by professional | PROFESSIONAL_ACCEPTED | Full set + license + association |
| Digital signature applied | SIGNATURE_APPLIED | Full set + signature hash |
| Analysis rejected by professional | PROFESSIONAL_REJECTED | Full set + rejection reason |
| Report exported/downloaded | REPORT_EXPORTED | userId, format, timestamp |

**Rationale:**

- ✅ Full credential capture enables forensic traceability
- ✅ Server-side timestamps prevent tampering
- ✅ Session tracking links related actions
- ✅ IP/userAgent provides device fingerprint
- ✅ Professional credentials establish accountability
- ✅ Immutable records support legal discovery

---

## Update 3: Create New nbcRules Table (Versioned Rules)

**New Table:**

```sql
CREATE TABLE nbcRules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruleId VARCHAR(50) UNIQUE NOT NULL 
    COMMENT 'Unique identifier (e.g., NBC-3.1.5.1)',
  section VARCHAR(20) NOT NULL 
    COMMENT 'NBC section number (e.g., 3.1.5.1)',
  clause VARCHAR(100) NOT NULL 
    COMMENT 'Clause description',
  description TEXT NOT NULL 
    COMMENT 'Full text of the rule requirement',
  category ENUM('structural', 'fire-safety', 'connections', 'materials', 'csa') 
    NOT NULL 
    COMMENT 'Rule category for filtering',
  jurisdiction VARCHAR(50) 
    COMMENT 'Jurisdiction (national, AB, BC, ON, etc)',
  ruleVersion INT NOT NULL DEFAULT 1 
    COMMENT 'Version number for rule changes',
  isActive BOOLEAN NOT NULL DEFAULT TRUE 
    COMMENT 'Whether rule is currently active',
  
  -- Rule Evaluation Metadata
  requiredFields JSON 
    COMMENT 'Required DrawingData fields for this rule',
  evaluationLogic VARCHAR(500) 
    COMMENT 'Description of evaluation logic',
  
  -- Audit Trail
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdByUserId INT 
    COMMENT 'FK to users - who created/imported rule',
  
  -- Indexes
  UNIQUE KEY uk_ruleId_version (ruleId, ruleVersion),
  INDEX idx_section (section),
  INDEX idx_category (category),
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_isActive (isActive),
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);
```

**Rationale:**

- ✅ Versioning enables reproducibility (can replay analysis with same rule version)
- ✅ Category filtering enables targeted analysis
- ✅ Jurisdiction support enables regional compliance
- ✅ isActive flag allows deprecating old rules without deleting
- ✅ Audit trail tracks rule creation/modification
- ✅ Metadata enables deterministic evaluation

---

## Update 4: Add Disclaimer Gate Tracking Table

**New Table (Optional but Recommended):**

```sql
CREATE TABLE disclaimerAcknowledgments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  disclaimerVersion VARCHAR(20) NOT NULL,
  disclaimerText TEXT NOT NULL 
    COMMENT 'Full text of disclaimer acknowledged',
  acknowledgedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'Server-side UTC timestamp',
  ipAddress VARCHAR(45),
  userAgent TEXT,
  
  INDEX idx_userId (userId),
  INDEX idx_acknowledgedAt (acknowledgedAt),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**Rationale:**

- ✅ Separate table for disclaimer tracking
- ✅ Enables audit of all disclaimer acknowledgments
- ✅ Supports legal proof of informed consent
- ✅ Tracks disclaimer version changes

---

## Migration Script

**File:** `drizzle/migrations/add_nbc_analyzer_schema.sql`

```sql
-- Phase 1: Critical Clarifications Schema Updates
-- Date: March 2026
-- Purpose: Add legal defensibility, immutability, and audit trail fields

-- 1. Update drawingAnalyses table
ALTER TABLE drawingAnalyses ADD COLUMN (
  drawingHash VARCHAR(64) NOT NULL AFTER drawingUrl,
  drawingSnapshotKey VARCHAR(500) AFTER drawingHash,
  drawingSnapshotMimeType VARCHAR(50) AFTER drawingSnapshotKey,
  drawingSnapshotSize INT AFTER drawingSnapshotMimeType,
  analysisStatus ENUM('DRAFT', 'UNDER_REVIEW', 'VALID', 'REJECTED') 
    NOT NULL DEFAULT 'DRAFT' AFTER recommendations,
  disclaimerAcknowledged BOOLEAN NOT NULL DEFAULT FALSE AFTER analysisStatus,
  disclaimerAcknowledgedAt TIMESTAMP AFTER disclaimerAcknowledged,
  disclaimerVersion VARCHAR(20) NOT NULL AFTER disclaimerAcknowledgedAt,
  llmModelVersion VARCHAR(50) AFTER disclaimerVersion,
  ruleEngineVersion VARCHAR(20) AFTER llmModelVersion,
  validatedAt TIMESTAMP AFTER ruleEngineVersion,
  validatedByUserId INT AFTER validatedAt,
  validatedByLicenseNumber VARCHAR(100) AFTER validatedByUserId,
  validatedByAssociation VARCHAR(100) AFTER validatedByLicenseNumber
);

-- Add indexes
ALTER TABLE drawingAnalyses ADD INDEX idx_analysisStatus (analysisStatus);
ALTER TABLE drawingAnalyses ADD INDEX idx_disclaimerAcknowledged (disclaimerAcknowledged);
ALTER TABLE drawingAnalyses ADD INDEX idx_validatedAt (validatedAt);
ALTER TABLE drawingAnalyses ADD INDEX idx_drawingHash (drawingHash);
ALTER TABLE drawingAnalyses ADD FOREIGN KEY (validatedByUserId) REFERENCES users(id);

-- 2. Update complianceAuditTrail table
ALTER TABLE complianceAuditTrail ADD COLUMN (
  userEmail VARCHAR(255) NOT NULL AFTER userId,
  userFullName VARCHAR(255) AFTER userEmail,
  professionalLicenseNumber VARCHAR(100) AFTER userFullName,
  professionalAssociation VARCHAR(100) AFTER professionalLicenseNumber,
  jurisdiction VARCHAR(100) AFTER professionalAssociation,
  ipAddress VARCHAR(45) AFTER jurisdiction,
  userAgent TEXT AFTER ipAddress,
  sessionId VARCHAR(255) AFTER userAgent
);

-- Add indexes
ALTER TABLE complianceAuditTrail ADD INDEX idx_userEmail (userEmail);
ALTER TABLE complianceAuditTrail ADD INDEX idx_professionalLicenseNumber (professionalLicenseNumber);
ALTER TABLE complianceAuditTrail ADD INDEX idx_jurisdiction (jurisdiction);
ALTER TABLE complianceAuditTrail ADD INDEX idx_sessionId (sessionId);
ALTER TABLE complianceAuditTrail ADD INDEX idx_action (action);

-- 3. Create nbcRules table
CREATE TABLE nbcRules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruleId VARCHAR(50) UNIQUE NOT NULL,
  section VARCHAR(20) NOT NULL,
  clause VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('structural', 'fire-safety', 'connections', 'materials', 'csa') NOT NULL,
  jurisdiction VARCHAR(50),
  ruleVersion INT NOT NULL DEFAULT 1,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  requiredFields JSON,
  evaluationLogic VARCHAR(500),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdByUserId INT,
  UNIQUE KEY uk_ruleId_version (ruleId, ruleVersion),
  INDEX idx_section (section),
  INDEX idx_category (category),
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_isActive (isActive),
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);

-- 4. Create disclaimerAcknowledgments table
CREATE TABLE disclaimerAcknowledgments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  disclaimerVersion VARCHAR(20) NOT NULL,
  disclaimerText TEXT NOT NULL,
  acknowledgedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  INDEX idx_userId (userId),
  INDEX idx_acknowledgedAt (acknowledgedAt),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## Database Permission Updates

**CRITICAL: Enforce Immutability at Database Layer**

```sql
-- Create read-only user for audit trail
CREATE USER 'audit_readonly'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT ON building_code_app.complianceAuditTrail TO 'audit_readonly'@'localhost';

-- Revoke UPDATE and DELETE on audit trail
REVOKE UPDATE, DELETE ON building_code_app.complianceAuditTrail FROM 'app_user'@'localhost';

-- Verify permissions
SHOW GRANTS FOR 'app_user'@'localhost';
-- Should NOT include UPDATE or DELETE on complianceAuditTrail
```

---

## Drizzle ORM Schema Updates

**File:** `drizzle/schema.ts`

```typescript
import { sql } from 'drizzle-orm';

// Update drawingAnalyses table
export const drawingAnalyses = mysqlTable('drawingAnalyses', {
  id: int('id').primaryKey().autoincrement(),
  projectId: int('projectId').notNull(),
  userId: int('userId').notNull(),
  drawingUrl: text('drawingUrl').notNull(),
  
  // NEW: Drawing Immutability
  drawingHash: varchar('drawingHash', { length: 64 }).notNull(),
  drawingSnapshotKey: varchar('drawingSnapshotKey', { length: 500 }),
  drawingSnapshotMimeType: varchar('drawingSnapshotMimeType', { length: 50 }),
  drawingSnapshotSize: int('drawingSnapshotSize'),
  
  analysisType: mysqlEnum('analysisType', ['structural', 'fire-safety', 'connections', 'comprehensive']),
  complianceScore: int('complianceScore'),
  complianceLevel: mysqlEnum('complianceLevel', ['approved', 'conditional', 'revision', 'rejected']),
  
  // NEW: Analysis Status
  analysisStatus: mysqlEnum('analysisStatus', ['DRAFT', 'UNDER_REVIEW', 'VALID', 'REJECTED'])
    .notNull()
    .default('DRAFT'),
  
  // NEW: Disclaimer Tracking
  disclaimerAcknowledged: boolean('disclaimerAcknowledged').notNull().default(false),
  disclaimerAcknowledgedAt: timestamp('disclaimerAcknowledgedAt'),
  disclaimerVersion: varchar('disclaimerVersion', { length: 20 }).notNull(),
  
  // NEW: Versioning
  llmModelVersion: varchar('llmModelVersion', { length: 50 }),
  ruleEngineVersion: varchar('ruleEngineVersion', { length: 20 }),
  
  // NEW: Professional Validation
  validatedAt: timestamp('validatedAt'),
  validatedByUserId: int('validatedByUserId'),
  validatedByLicenseNumber: varchar('validatedByLicenseNumber', { length: 100 }),
  validatedByAssociation: varchar('validatedByAssociation', { length: 100 }),
  
  structuralStatus: json('structuralStatus'),
  fireSafetyStatus: json('fireSafetyStatus'),
  connectionStatus: json('connectionStatus'),
  issues: json('issues'),
  recommendations: json('recommendations'),
  
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').onUpdateNow(),
});

// NEW: nbcRules table
export const nbcRules = mysqlTable('nbcRules', {
  id: int('id').primaryKey().autoincrement(),
  ruleId: varchar('ruleId', { length: 50 }).unique().notNull(),
  section: varchar('section', { length: 20 }).notNull(),
  clause: varchar('clause', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: mysqlEnum('category', ['structural', 'fire-safety', 'connections', 'materials', 'csa']).notNull(),
  jurisdiction: varchar('jurisdiction', { length: 50 }),
  ruleVersion: int('ruleVersion').notNull().default(1),
  isActive: boolean('isActive').notNull().default(true),
  requiredFields: json('requiredFields'),
  evaluationLogic: varchar('evaluationLogic', { length: 500 }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').onUpdateNow(),
  createdByUserId: int('createdByUserId'),
});
```

---

## Validation Checklist

Before proceeding to Phase 2, verify:

- [ ] All new columns added to drawingAnalyses
- [ ] All new columns added to complianceAuditTrail
- [ ] nbcRules table created
- [ ] disclaimerAcknowledgments table created
- [ ] All indexes created
- [ ] Foreign keys established
- [ ] Database permissions updated (no UPDATE/DELETE on audit trail)
- [ ] Drizzle schema updated
- [ ] Migration script tested
- [ ] Backward compatibility verified
- [ ] No existing data lost

---

**Schema Update Status:** Ready for Migration  
**Migration Script:** `drizzle/migrations/add_nbc_analyzer_schema.sql`  
**Drizzle Updates:** `drizzle/schema.ts`  
**Next Step:** Phase 2 Service Layer Implementation
