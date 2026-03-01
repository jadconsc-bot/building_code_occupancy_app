import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User bookmarks for occupancy codes
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  occupancyCode: varchar("occupancyCode", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * User notes for occupancy codes
 */
export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  occupancyCode: varchar("occupancyCode", { length: 10 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * User feedback submissions for beta testing
 */
export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  rating: int("rating").notNull(), // 1-5 star rating
  feedbackType: mysqlEnum("feedbackType", ["bug", "feature", "improvement", "other"]).notNull(),
  category: varchar("category", { length: 50 }), // e.g., "calculators", "ui", "data-accuracy"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  currentPage: varchar("currentPage", { length: 255 }), // URL or page identifier
  browserInfo: text("browserInfo"), // User agent string
  resolved: int("resolved").default(0).notNull(), // 0 = open, 1 = resolved
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

/**
 * Projects for building code compliance tracking
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  occupancyCode: varchar("occupancyCode", { length: 10 }).notNull(),
  template: varchar("template", { length: 50 }), // e.g., "residential", "commercial", "industrial"
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  overallProgress: int("overallProgress").default(0).notNull(), // 0-100 percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Calculator results linked to projects
 */
export const projectCalculatorResults = mysqlTable("projectCalculatorResults", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  calculatorType: varchar("calculatorType", { length: 50 }).notNull(), // e.g., "occupantLoad", "fireExit", "stairDesign"
  inputData: text("inputData").notNull(), // JSON string of calculator inputs
  resultData: text("resultData").notNull(), // JSON string of calculation results
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectCalculatorResult = typeof projectCalculatorResults.$inferSelect;
export type InsertProjectCalculatorResult = typeof projectCalculatorResults.$inferInsert;

/**
 * Checklist items linked to projects
 */
export const projectChecklistItems = mysqlTable("projectChecklistItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phase: varchar("phase", { length: 50 }).notNull(), // e.g., "design", "permitting", "construction", "inspection"
  itemId: varchar("itemId", { length: 100 }).notNull(), // Unique identifier for the item
  itemText: text("itemText").notNull(),
  isCompleted: int("isCompleted").default(0).notNull(), // 0 = false, 1 = true
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  photoUrl: varchar("photoUrl", { length: 500 }), // S3 URL for photo evidence
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectChecklistItem = typeof projectChecklistItems.$inferSelect;
export type InsertProjectChecklistItem = typeof projectChecklistItems.$inferInsert;


/**
 * Versioned rulesets for compliance engine
 * Each ruleset is immutable and tied to a specific code edition
 */
export const rulesets = mysqlTable("rulesets", {
  id: int("id").autoincrement().primaryKey(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull().unique(), // e.g., "nbc_ae_2023_v1"
  code: varchar("code", { length: 50 }).notNull(), // e.g., "NBC(AE)"
  edition: varchar("edition", { length: 20 }).notNull(), // e.g., "2023"
  amendment: varchar("amendment", { length: 50 }), // e.g., "2023-12"
  version: varchar("version", { length: 20 }).notNull(), // e.g., "1.0.0"
  effectiveDate: timestamp("effectiveDate").notNull(),
  retiredDate: timestamp("retiredDate"), // null if still active
  description: text("description"),
  rulesData: text("rulesData").notNull(), // JSON array of all rules
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ruleset = typeof rulesets.$inferSelect;
export type InsertRuleset = typeof rulesets.$inferInsert;

/**
 * Immutable compliance snapshots
 * Frozen results tied to a specific ruleset version
 */
export const complianceSnapshots = mysqlTable("complianceSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotId: varchar("snapshotId", { length: 100 }).notNull().unique(), // UUID
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(), // Reference to rulesets table
  mode: mysqlEnum("mode", ["strict", "soft"]).default("soft").notNull(),
  inputs: text("inputs").notNull(), // JSON of all inputs
  outputs: text("outputs").notNull(), // JSON of all outputs
  ruleTrace: text("ruleTrace").notNull(), // JSON array of which rules fired
  complianceStatus: mysqlEnum("complianceStatus", ["compliant", "non_compliant", "conditional"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComplianceSnapshot = typeof complianceSnapshots.$inferSelect;
export type InsertComplianceSnapshot = typeof complianceSnapshots.$inferInsert;

/**
 * Rule changelog for governance and audit
 */
export const ruleChangelog = mysqlTable("ruleChangelog", {
  id: int("id").autoincrement().primaryKey(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  changeType: mysqlEnum("changeType", ["added", "modified", "deprecated", "removed"]).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  clause: varchar("clause", { length: 50 }).notNull(),
  description: text("description").notNull(),
  reason: text("reason"),
  approvedBy: int("approvedBy"), // User ID of approver
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RuleChange = typeof ruleChangelog.$inferSelect;
export type InsertRuleChange = typeof ruleChangelog.$inferInsert;

/**
 * Audit log for all compliance analyses
 */
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  snapshotId: varchar("snapshotId", { length: 100 }),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "analysis_run", "snapshot_created", "snapshot_exported"
  details: text("details"), // JSON with additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;

/**
 * Rule test cases for regression testing
 */
export const ruleTests = mysqlTable("ruleTests", {
  id: int("id").autoincrement().primaryKey(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  inputs: text("inputs").notNull(), // JSON of test inputs
  expectedOutputs: text("expectedOutputs").notNull(), // JSON of expected outputs
  passed: int("passed").default(0).notNull(), // 0 = failed, 1 = passed
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RuleTest = typeof ruleTests.$inferSelect;
export type InsertRuleTest = typeof ruleTests.$inferInsert;


/**
 * Rule Editor Roles and Credentials
 * Tracks professional credentials and authority levels for rule updates
 */
export const ruleEditorRoles = mysqlTable("ruleEditorRoles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  role: mysqlEnum("role", ["viewer", "editor", "reviewer", "admin"]).default("viewer").notNull(),
  profession: varchar("profession", { length: 100 }), // e.g., "Architect", "Engineer", "Building Official"
  licenseNumber: varchar("licenseNumber", { length: 100 }).unique(),
  licenseProvince: varchar("licenseProvince", { length: 50 }), // e.g., "Alberta", "Ontario"
  licenseExpiry: timestamp("licenseExpiry"),
  credentials: text("credentials"), // JSON with credential details
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // Admin user who verified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RuleEditorRole = typeof ruleEditorRoles.$inferSelect;
export type InsertRuleEditorRole = typeof ruleEditorRoles.$inferInsert;

/**
 * Rule Change Requests
 * Tracks proposed rule changes awaiting admin approval
 */
export const ruleChangeRequests = mysqlTable("ruleChangeRequests", {
  id: int("id").autoincrement().primaryKey(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  requestedBy: int("requestedBy").notNull(), // User ID of editor
  changeType: mysqlEnum("changeType", ["create", "update", "delete", "deprecate"]).notNull(),
  currentValue: text("currentValue"), // JSON of current rule
  proposedValue: text("proposedValue"), // JSON of proposed rule
  justification: text("justification").notNull(), // Why this change is needed
  codeReference: varchar("codeReference", { length: 255 }), // e.g., "NBC 3.2.2.47"
  status: mysqlEnum("status", ["pending", "approved", "rejected", "implemented"]).default("pending").notNull(),
  approvedBy: int("approvedBy"), // Admin user ID
  approvalNotes: text("approvalNotes"),
  digitalSignature: text("digitalSignature"), // Cryptographic signature
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  implementedAt: timestamp("implementedAt"),
});

export type RuleChangeRequest = typeof ruleChangeRequests.$inferSelect;
export type InsertRuleChangeRequest = typeof ruleChangeRequests.$inferInsert;

/**
 * Rule Change Audit Trail
 * Complete immutable audit trail of all rule modifications
 */
export const ruleChangeAudit = mysqlTable("ruleChangeAudit", {
  id: int("id").autoincrement().primaryKey(),
  changeRequestId: int("changeRequestId").notNull(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // "requested", "approved", "rejected", "implemented"
  actor: int("actor").notNull(), // User ID performing action
  actorRole: varchar("actorRole", { length: 50 }).notNull(), // Role of actor at time of action
  actorCredentials: text("actorCredentials"), // JSON snapshot of actor credentials
  details: text("details"), // JSON with additional context
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client info
  cryptographicHash: varchar("cryptographicHash", { length: 256 }), // SHA-256 hash for integrity
  previousHash: varchar("previousHash", { length: 256 }), // Hash of previous entry (blockchain-like)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type RuleChangeAuditEntry = typeof ruleChangeAudit.$inferSelect;
export type InsertRuleChangeAuditEntry = typeof ruleChangeAudit.$inferInsert;

/**
 * Rule Change Notifications
 * Alerts for stakeholders about rule changes
 */
export const ruleChangeNotifications = mysqlTable("ruleChangeNotifications", {
  id: int("id").autoincrement().primaryKey(),
  changeRequestId: int("changeRequestId").notNull(),
  recipientId: int("recipientId").notNull(), // User ID to notify
  notificationType: mysqlEnum("notificationType", ["change_requested", "change_approved", "change_rejected", "change_implemented"]).notNull(),
  read: int("read").default(0).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RuleChangeNotification = typeof ruleChangeNotifications.$inferSelect;
export type InsertRuleChangeNotification = typeof ruleChangeNotifications.$inferInsert;

/**
 * Digital Signatures for Rule Changes
 * Cryptographic signatures for legal defensibility
 */
export const digitalSignatures = mysqlTable("digitalSignatures", {
  id: int("id").autoincrement().primaryKey(),
  changeRequestId: int("changeRequestId").notNull(),
  signedBy: int("signedBy").notNull(), // User ID
  signatureType: varchar("signatureType", { length: 50 }).notNull(), // "approval", "implementation"
  publicKey: text("publicKey"), // PEM format
  signature: text("signature").notNull(), // Base64 encoded signature
  certificateChain: text("certificateChain"), // PEM format certificate chain
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "failed"]).default("pending").notNull(),
});

export type DigitalSignature = typeof digitalSignatures.$inferSelect;
export type InsertDigitalSignature = typeof digitalSignatures.$inferInsert;

/**
 * ============================================================================
 * SERVER-SIDE CALCULATION TABLES
 * For legally-binding compliance decisions with cryptographic integrity
 * ============================================================================
 */

/**
 * Calculation Results - Immutable records of all calculations
 * Every calculation is cryptographically signed and stored immutably
 */
export const calculationResults = mysqlTable("calculationResults", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  calculatorType: varchar("calculatorType", { length: 50 }).notNull(),
  rulesetVersion: varchar("rulesetVersion", { length: 50 }).notNull(),
  inputData: text("inputData").notNull(),
  resultData: text("resultData").notNull(),
  calculationTrace: text("calculationTrace"),
  cryptographicSignature: text("cryptographicSignature").notNull(),
  certificateChain: text("certificateChain"),
  signatureVerified: boolean("signatureVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  immutable: boolean("immutable").default(true).notNull(),
});

export type CalculationResult = typeof calculationResults.$inferSelect;
export type InsertCalculationResult = typeof calculationResults.$inferInsert;

/**
 * Calculation Audit Log - Complete history of all calculation actions
 */
export const calculationAuditLog = mysqlTable("calculationAuditLog", {
  id: varchar("id", { length: 36 }).primaryKey(),
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  actor: int("actor").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

export type CalculationAuditLogEntry = typeof calculationAuditLog.$inferSelect;
export type InsertCalculationAuditLogEntry = typeof calculationAuditLog.$inferInsert;

/**
 * Versioned Rulesets - Immutable copies of calculation rules
 */
export const calculationRulesets = mysqlTable("calculationRulesets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  effectiveDate: date("effectiveDate").notNull(),
  retiredDate: date("retiredDate"),
  rulesJSON: text("rulesJSON").notNull(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
  description: text("description"),
});

export type CalculationRuleset = typeof calculationRulesets.$inferSelect;
export type InsertCalculationRuleset = typeof calculationRulesets.$inferInsert;

/**
 * Digital Certificates - PKI infrastructure for cryptographic signing
 */
export const calculationCertificates = mysqlTable("calculationCertificates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  certificateName: varchar("certificateName", { length: 255 }).notNull(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  issuer: varchar("issuer", { length: 255 }),
  subject: varchar("subject", { length: 255 }),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil").notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalculationCertificate = typeof calculationCertificates.$inferSelect;
export type InsertCalculationCertificate = typeof calculationCertificates.$inferInsert;

/**
 * Calculation Challenges - For disputing calculation results
 */
export const calculationChallenges = mysqlTable("calculationChallenges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  challengedBy: int("challengedBy").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "dismissed"]).default("open").notNull(),
  resolution: text("resolution"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalculationChallenge = typeof calculationChallenges.$inferSelect;
export type InsertCalculationChallenge = typeof calculationChallenges.$inferInsert;
