import { sql } from "drizzle-orm";
import { int, json, mysqlEnum, mysqlTable, text, mediumtext, timestamp, varchar, boolean, date, decimal, tinyint, float, datetime } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["free", "home_user", "basic", "professional", "rule_editor", "admin", "org_admin"]).notNull().default("free"),
  orgId: int("orgId"),
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
  province: varchar("province", { length: 5 }), // "AB" | "BC" | "ON" | etc.
  climateZone: varchar("climateZone", { length: 10 }), // "4", "5", "6", "7A", "7B", "8"
  seismicZone: varchar("seismicZone", { length: 20 }), // "Low" | "Intermediate" | "High" | "Very High"
  buildingType: varchar("buildingType", { length: 50 }), // "part9_single_family" | "part9_multiplex" | etc.
  stepCodeTier: varchar("stepCodeTier", { length: 5 }), // "1"-"5", BC only
  jurisdictionDetected: boolean("jurisdictionDetected").default(false),
  projectCode: varchar("projectCode", { length: 50 }), // user-entered code e.g. "CCC21", "ABC-2024"
  grossFloorArea: decimal("grossFloorArea", { precision: 10, scale: 2 }),
  projectNumber: varchar("projectNumber", { length: 20 }), // auto-generated e.g. "CC-2025-001"
  codeEdition: varchar("codeEdition", { length: 20 }), // e.g. "NBC 2020", "BCBC 2024"
  part3Determination: varchar("part3Determination", { length: 100 }), // e.g. "Part 3 — Large Building"
  constructionType: varchar("constructionType", { length: 50 }),
  sprinklersRequired: tinyint("sprinklersRequired"), // 1 = required, 0 = not required
  zoningCategory: varchar("zoningCategory", { length: 50 }), // e.g. "RM-4", "C-1"
  storeys: int("storeys"), // number of storeys above grade
  buildingHeight: decimal("buildingHeight", { precision: 6, scale: 2 }), // metres above grade
  municipality:     varchar("municipality", { length: 100 }),
  zoneCode:         varchar("zoneCode", { length: 50 }),
  zoneName:         varchar("zoneName", { length: 200 }),
  zoneLookupSource: mysqlEnum("zoneLookupSource", ["manual", "geocoded_calgary", "geocoded_edmonton", "geocoded_other"]).default("manual"),
  parcelLat:        decimal("parcelLat", { precision: 10, scale: 7 }),
  parcelLng:        decimal("parcelLng", { precision: 10, scale: 7 }),
  communityName:    varchar("communityName", { length: 100 }),
  zoneConfirmedAt:  timestamp("zoneConfirmedAt"),
  jurisdictionSource: mysqlEnum("jurisdictionSource", ["geocoded", "manual", "device", "fallback"]).default("manual"),
  geocodedAt:       datetime("geocodedAt"),
  // F2+F3 — Stack Planner FRR bridge
  stackSeparationsJson: json("stackSeparationsJson"),
  stackWingsJson:       json("stackWingsJson"),
  stackConfirmedAt:     datetime("stackConfirmedAt"),
  siteConstraints: text("siteConstraints"),
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
  archivedAt: timestamp("archivedAt"),
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
  actor: int("actor"),
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

/**
 * ============================================================================
 * PHASE 2A: PROFESSIONAL WORKFLOW TABLES
 * For consultant firms, client management, and collaboration
 * ============================================================================
 */

/**
 * Clients - Organizations or individuals using the platform
 * Enables consultant firms to manage multiple clients
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Primary contact/owner
  firmId: int("firmId"), // If part of a firm
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 50 }),
  postalCode: varchar("postalCode", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }),
  industry: varchar("industry", { length: 100 }), // e.g., "residential", "commercial", "industrial"
  status: mysqlEnum("status", ["active", "inactive", "archived"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Project Members - Team collaboration on projects
 * Tracks who has access to which projects and their roles
 */
export const projectMembers = mysqlTable("projectMembers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "editor", "reviewer", "viewer"]).default("viewer").notNull(),
  permissions: text("permissions"), // JSON array of specific permissions
  addedBy: int("addedBy").notNull(), // User who added this member
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  removedAt: timestamp("removedAt"), // null if still active
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * Team Roles - Define custom roles for firms
 * Allows firms to create role templates
 */
export const teamRoles = mysqlTable("teamRoles", {
  id: int("id").autoincrement().primaryKey(),
  firmId: int("firmId").notNull(), // Firm this role belongs to
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  permissions: text("permissions").notNull(), // JSON array of permissions
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamRole = typeof teamRoles.$inferSelect;
export type InsertTeamRole = typeof teamRoles.$inferInsert;

/**
 * ============================================================================
 * PHASE 3: MONETIZATION TABLES
 * For subscription management and usage tracking
 * ============================================================================
 */

/**
 * Subscription Plans - Available pricing tiers
 */
export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Individual", "Consultant", "Firm"
  description: text("description"),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearlyPrice", { precision: 10, scale: 2 }),
  features: text("features").notNull(), // JSON array of feature names
  maxProjects: int("maxProjects"), // null for unlimited
  maxUsers: int("maxUsers"), // null for unlimited
  maxClients: int("maxClients"), // null for unlimited
  canGenerateReports: boolean("canGenerateReports").default(false).notNull(),
  canShareProjects: boolean("canShareProjects").default(false).notNull(),
  canCollaborate: boolean("canCollaborate").default(false).notNull(),
  supportLevel: varchar("supportLevel", { length: 50 }), // "email", "priority", "dedicated"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User Subscriptions - Track which users have which plans
 */
export const userSubscriptions = mysqlTable("userSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "paused", "cancelled", "expired"]).default("active").notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelledAt: timestamp("cancelledAt"),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }), // Stripe subscription ID
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe customer ID
  isFoundingMember: tinyint("isFoundingMember").notNull().default(0),
  homeReportsRemaining: int("homeReportsRemaining").notNull().default(0),
  contractorPackPurchased: boolean("contractorPackPurchased").notNull().default(false),
  contractorPackPurchasedAt: timestamp("contractorPackPurchasedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Founding Member Counter - Tracks global LTP offer slots
 */
export const foundingMemberCounter = mysqlTable("foundingMemberCounter", {
  id: int("id").autoincrement().primaryKey(),
  claimed: int("claimed").notNull().default(247),
  cap: int("cap").notNull().default(1000),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FoundingMemberCounter = typeof foundingMemberCounter.$inferSelect;

/**
 * Team Plan Waitlist
 */
export const teamWaitlist = mysqlTable("teamWaitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 50 }).default("billing_page"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamWaitlist = typeof teamWaitlist.$inferSelect;
export type InsertTeamWaitlist = typeof teamWaitlist.$inferInsert;

/**
 * Usage Metrics - Track feature usage for ROI visibility
 */
export const usageMetrics = mysqlTable("usageMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  projectsCreated: int("projectsCreated").default(0).notNull(),
  calculationsRun: int("calculationsRun").default(0).notNull(),
  reportsGenerated: int("reportsGenerated").default(0).notNull(),
  projectsShared: int("projectsShared").default(0).notNull(),
  hoursEstimatedSaved: decimal("hoursEstimatedSaved", { precision: 10, scale: 2 }).default("0").notNull(),
  riskReductionScore: decimal("riskReductionScore", { precision: 5, scale: 2 }).default("0").notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = typeof usageMetrics.$inferInsert;

/**
 * ============================================================================
 * PHASE 2D: SHARING & VERIFICATION TABLES
 * For reviewer access and public verification
 * ============================================================================
 */

/**
 * Share Links - Read-only access to projects for reviewers
 */
export const shareLinks = mysqlTable("shareLinks", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  projectId: int("projectId").notNull(),
  createdBy: int("createdBy").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(), // Random token for URL
  accessLevel: mysqlEnum("accessLevel", ["view_only", "comment", "download"]).default("view_only").notNull(),
  expiresAt: timestamp("expiresAt"), // null for never expires
  maxAccessCount: int("maxAccessCount"), // null for unlimited
  accessCount: int("accessCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = typeof shareLinks.$inferInsert;

/**
 * Share Link Access Log - Track who accessed shared projects
 */
export const shareLinkAccessLog = mysqlTable("shareLinkAccessLog", {
  id: int("id").autoincrement().primaryKey(),
  shareLinkId: varchar("shareLinkId", { length: 36 }).notNull(),
  accessedAt: timestamp("accessedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  accessedBy: int("accessedBy"), // null if anonymous
});

export type ShareLinkAccessLog = typeof shareLinkAccessLog.$inferSelect;
export type InsertShareLinkAccessLog = typeof shareLinkAccessLog.$inferInsert;

/**
 * Verification Tokens - For public verification portal
 */
export const verificationTokens = mysqlTable("verificationTokens", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  isPublic: boolean("isPublic").default(false).notNull(),
  expiresAt: timestamp("expiresAt"), // null for never expires
  viewCount: int("viewCount").default(0).notNull(),
  lastViewedAt: timestamp("lastViewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertVerificationToken = typeof verificationTokens.$inferInsert;

/**
 * ============================================================================
 * PHASE 2C: CALCULATION VERSIONING TABLES
 * For one-click recalculation with version tracking
 * ============================================================================
 */

/**
 * Calculation Versions - Track calculation history with versions
 */
export const calculationVersions = mysqlTable("calculationVersions", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  versionNumber: int("versionNumber").notNull(),
  parentVersionId: varchar("parentVersionId", { length: 36 }), // Previous version
  inputData: text("inputData").notNull(), // JSON
  resultData: text("resultData").notNull(), // JSON
  changeReason: text("changeReason"), // Why this version was created
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type CalculationVersion = typeof calculationVersions.$inferSelect;
export type InsertCalculationVersion = typeof calculationVersions.$inferInsert;

/**
 * ============================================================================
 * PHASE 4D: STRUCTURED LOGGING TABLES
 * For comprehensive audit and troubleshooting
 * ============================================================================
 */

/**
 * Request Logs - HTTP request logging for debugging
 */
export const requestLogs = mysqlTable("requestLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: int("userId"),
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, etc.
  path: varchar("path", { length: 500 }).notNull(),
  statusCode: int("statusCode").notNull(),
  duration: int("duration").notNull(), // milliseconds
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  errorMessage: text("errorMessage"), // null if successful
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type RequestLog = typeof requestLogs.$inferSelect;
export type InsertRequestLog = typeof requestLogs.$inferInsert;

/**
 * Signature Logs - Cryptographic signature operations
 */
export const signatureLogs = mysqlTable("signatureLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  operation: varchar("operation", { length: 50 }).notNull(), // "sign", "verify"
  status: mysqlEnum("status", ["success", "failure"]).notNull(),
  keyId: varchar("keyId", { length: 100 }),
  signatureAlgorithm: varchar("signatureAlgorithm", { length: 50 }), // "RSA-2048", "SHA-256"
  details: text("details"), // JSON with additional context
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SignatureLog = typeof signatureLogs.$inferSelect;
export type InsertSignatureLog = typeof signatureLogs.$inferInsert;

/**
 * Calculation Logs - Detailed calculation execution logs
 */
export const calculationLogs = mysqlTable("calculationLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  calculatorType: varchar("calculatorType", { length: 50 }).notNull(),
  stage: varchar("stage", { length: 50 }).notNull(), // "validation", "execution", "signing"
  message: text("message").notNull(),
  level: mysqlEnum("level", ["debug", "info", "warn", "error"]).notNull(),
  details: text("details"), // JSON with additional context
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type CalculationLog = typeof calculationLogs.$inferSelect;
export type InsertCalculationLog = typeof calculationLogs.$inferInsert;


/**
 * ============================================================================
 * DRAWING ANALYSIS TABLES (Drizzle ORM definitions)
 * Maps to existing DB tables created by 0002_drawing_analysis_tables.sql
 * Per Prime Directive 2.0 §4.1: LLM = data extractor, ComplianceEngine = judge
 * ============================================================================
 */

/**
 * Drawing Analyses - Core analysis records
 * Status workflow: DRAFT → UNDER_REVIEW → VALID | REJECTED
 * Per PD2.0 §4.3: Only VALID records may be exported as compliance reports
 */
export const drawingAnalyses = mysqlTable("drawingAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  drawingUrl: text("drawingUrl"),
  drawingHash: varchar("drawingHash", { length: 64 }), // SHA-256, computed at upload time (PD2.0 §4.2)
  drawingSnapshotKey: varchar("drawingSnapshotKey", { length: 500 }),
  drawingSnapshotMimeType: varchar("drawingSnapshotMimeType", { length: 50 }),
  drawingSnapshotSize: int("drawingSnapshotSize"),
  analysisType: varchar("analysisType", { length: 50 }),
  analysisStatus: mysqlEnum("analysisStatus", ["DRAFT", "UNDER_REVIEW", "VALID", "REJECTED"]).notNull().default("DRAFT"),
  complianceScore: int("complianceScore"),
  complianceLevel: varchar("complianceLevel", { length: 50 }),
  structuralStatus: text("structuralStatus"), // JSON
  fireSafetyStatus: text("fireSafetyStatus"), // JSON
  connectionStatus: text("connectionStatus"), // JSON
  issues: text("issues"), // JSON array
  recommendations: text("recommendations"), // JSON array
  disclaimerAcknowledged: boolean("disclaimerAcknowledged").notNull().default(false),
  disclaimerAcknowledgedAt: timestamp("disclaimerAcknowledgedAt"),
  disclaimerVersion: varchar("disclaimerVersion", { length: 20 }),
  llmModelVersion: varchar("llmModelVersion", { length: 50 }), // From response.model (PD2.0 §3.2)
  ruleEngineVersion: varchar("ruleEngineVersion", { length: 20 }),
  validatedAt: timestamp("validatedAt"),
  validatedByUserId: int("validatedByUserId"),
  validatedByLicenseNumber: varchar("validatedByLicenseNumber", { length: 100 }),
  validatedByAssociation: varchar("validatedByAssociation", { length: 100 }),
  // PDF / multi-page support
  fileType: mysqlEnum("fileType", ["pdf", "dwg", "png", "jpeg"]),
  pageCount: int("pageCount").default(1),
  uploadStatus: mysqlEnum("uploadStatus", ["pending", "processing", "complete", "error"]).default("complete"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrawingAnalysis = typeof drawingAnalyses.$inferSelect;
export type InsertDrawingAnalysis = typeof drawingAnalyses.$inferInsert;

/**
 * Drawing Pages - one row per rasterized PDF page (or single image page)
 */
export const drawingPages = mysqlTable("drawingPages", {
  id: int("id").autoincrement().primaryKey(),
  drawingId: int("drawingId").notNull(),
  pageNumber: int("pageNumber").notNull(),
  widthPx: int("widthPx").notNull(),
  heightPx: int("heightPx").notNull(),
  preprocessedUrl: varchar("preprocessedUrl", { length: 500 }),
  cropRegionJson: json("cropRegionJson"),
  cropRegionInheritedFrom: int("cropRegionInheritedFrom"),
  cropRegionSetAt: timestamp("cropRegionSetAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // LLM-judge eval results written asynchronously after detection
  evalAccuracy: float("evalAccuracy"),
  evalPassingRooms: int("evalPassingRooms"),
  evalTotalRooms: int("evalTotalRooms"),
  evalMissedRoomsJson: text("evalMissedRoomsJson"),
  detectedScale: varchar("detectedScale", { length: 100 }),
  calibrationScale: float("calibrationScale"),
  vectorExtracted: tinyint("vectorExtracted").default(0),
  vectorExtractedAt: timestamp("vectorExtractedAt"),
  wallSegmentCount: int("wallSegmentCount").default(0),
  vectorExtractionSource: mysqlEnum("vectorExtractionSource", ["pdf_paths", "raster_fallback", "none"]).default("none"),
});

export type DrawingPage = typeof drawingPages.$inferSelect;
export type InsertDrawingPage = typeof drawingPages.$inferInsert;

// ── Wall Geometry Tables (Phase B) ────────────────────────────────────────────

export const vectorPaths = mysqlTable("vectorPaths", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  drawingAnalysisId: int("drawingAnalysisId").notNull(),
  pathType: mysqlEnum("pathType", ["line", "polyline", "rect", "curve"]).notNull(),
  strokeWidth: decimal("strokeWidth", { precision: 6, scale: 3 }),
  strokeColor: varchar("strokeColor", { length: 20 }),
  fillColor: varchar("fillColor", { length: 20 }),
  pathDataJson: json("pathDataJson").notNull(),
  boundingBoxJson: json("boundingBoxJson"),
  pdfSpaceWidth: decimal("pdfSpaceWidth", { precision: 10, scale: 3 }),
  pdfSpaceHeight: decimal("pdfSpaceHeight", { precision: 10, scale: 3 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VectorPath = typeof vectorPaths.$inferSelect;
export type InsertVectorPath = typeof vectorPaths.$inferInsert;

export const wallSegments = mysqlTable("wallSegments", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  drawingAnalysisId: int("drawingAnalysisId").notNull(),
  startX: decimal("startX", { precision: 10, scale: 3 }).notNull(),
  startY: decimal("startY", { precision: 10, scale: 3 }).notNull(),
  endX: decimal("endX", { precision: 10, scale: 3 }).notNull(),
  endY: decimal("endY", { precision: 10, scale: 3 }).notNull(),
  thicknessPx: decimal("thicknessPx", { precision: 6, scale: 3 }),
  lengthPx: decimal("lengthPx", { precision: 10, scale: 3 }),
  orientation: mysqlEnum("orientation", ["horizontal", "vertical", "diagonal"]),
  confidence: decimal("confidence", { precision: 4, scale: 3 }).default("1.000"),
  source: mysqlEnum("source", ["vector", "raster", "manual"]).default("vector"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WallSegment = typeof wallSegments.$inferSelect;
export type InsertWallSegment = typeof wallSegments.$inferInsert;

export const doorOpenings = mysqlTable("doorOpenings", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  drawingAnalysisId: int("drawingAnalysisId").notNull(),
  centerX: decimal("centerX", { precision: 10, scale: 3 }).notNull(),
  centerY: decimal("centerY", { precision: 10, scale: 3 }).notNull(),
  widthPx: decimal("widthPx", { precision: 8, scale: 3 }),
  angle: decimal("angle", { precision: 6, scale: 2 }),
  wallSegmentId: int("wallSegmentId"),
  detectedFeatureId: int("detectedFeatureId"),
  confidence: decimal("confidence", { precision: 4, scale: 3 }).default("1.000"),
  source: mysqlEnum("source", ["vector", "feature_match", "manual"]).default("vector"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DoorOpening = typeof doorOpenings.$inferSelect;
export type InsertDoorOpening = typeof doorOpenings.$inferInsert;

/**
 * Drawing Data Extractions - Stage 1 output (LLM extraction only)
 * Per PD2.0 §4.1: This is the ONLY place LLM output is stored
 * LLM output is Zod-validated structured data, NOT compliance decisions
 */
export const drawingDataExtractions = mysqlTable("drawingDataExtractions", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  extractedData: text("extractedData"), // JSON - Zod-validated DrawingData
  extractionModel: varchar("extractionModel", { length: 100 }), // From response.model
  extractionPromptVersion: varchar("extractionPromptVersion", { length: 20 }),
  extractionConfidence: decimal("extractionConfidence", { precision: 3, scale: 2 }),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
});

export type DrawingDataExtraction = typeof drawingDataExtractions.$inferSelect;
export type InsertDrawingDataExtraction = typeof drawingDataExtractions.$inferInsert;

/**
 * NBC Rules - Deterministic rule definitions for compliance engine
 * Per PD2.0 §4.1: Rules are evaluated by the ComplianceEngine, NOT the LLM
 */
export const nbcRules = mysqlTable("nbcRules", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: varchar("ruleId", { length: 50 }).notNull().unique(),
  section: varchar("section", { length: 20 }).notNull(),
  clause: varchar("clause", { length: 100 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["structural", "fire-safety", "connections", "materials", "csa"]).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 50 }),
  ruleVersion: int("ruleVersion").notNull().default(1),
  isActive: boolean("isActive").notNull().default(true),
  requiredFields: text("requiredFields"), // JSON array
  evaluationLogic: varchar("evaluationLogic", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdByUserId: int("createdByUserId"),
});

export type NbcRule = typeof nbcRules.$inferSelect;
export type InsertNbcRule = typeof nbcRules.$inferInsert;

/**
 * Compliance Evaluation Results - Stage 2 output (deterministic rule engine)
 * Per PD2.0 §4.1: These are the compliance decisions made by the rule engine
 * The rule engine NEVER receives raw LLM output — only validated structured data
 */
export const complianceEvaluationResults = mysqlTable("complianceEvaluationResults", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  ruleId: int("ruleId").notNull(),
  ruleVersion: int("ruleVersion").notNull(),
  evaluationResult: mysqlEnum("evaluationResult", ["PASS", "FAIL", "CONDITIONAL", "UNABLE_TO_EVALUATE"]).notNull(),
  evaluationDetails: text("evaluationDetails"), // JSON
  evaluatedAt: timestamp("evaluatedAt").defaultNow().notNull(),
});

export type ComplianceEvaluationResult = typeof complianceEvaluationResults.$inferSelect;
export type InsertComplianceEvaluationResult = typeof complianceEvaluationResults.$inferInsert;

/**
 * Compliance Audit Trail - IMMUTABLE, APPEND-ONLY
 * Per PD2.0 §4.2: NO UPDATE or DELETE. Insert-only.
 * Per PD2.0 §7.1: All required fields must be populated
 */
export const complianceAuditTrail = mysqlTable("complianceAuditTrail", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // PD2.0 §7.2 action codes
  details: text("details").notNull(), // JSON
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  userFullName: varchar("userFullName", { length: 255 }),
  professionalLicenseNumber: varchar("professionalLicenseNumber", { length: 100 }),
  professionalAssociation: varchar("professionalAssociation", { length: 100 }),
  jurisdiction: varchar("jurisdiction", { length: 100 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  sessionId: varchar("sessionId", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ComplianceAuditTrailEntry = typeof complianceAuditTrail.$inferSelect;
export type InsertComplianceAuditTrailEntry = typeof complianceAuditTrail.$inferInsert;

/**
 * Disclaimer Acknowledgments - Records of user disclaimer acceptance
 * Per PD2.0 §6.3: Disclaimer enforced at API layer
 * Per PD2.0 §8.1: DISCLAIMER_ACKNOWLEDGED audit event fired immediately
 */
export const disclaimerAcknowledgments = mysqlTable("disclaimerAcknowledgments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  disclaimerVersion: varchar("disclaimerVersion", { length: 20 }).notNull(),
  disclaimerText: text("disclaimerText").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  acknowledgedAt:     timestamp("acknowledgedAt").defaultNow().notNull(),
  isImmutable:        tinyint("is_immutable").notNull().default(1),
});

export type DisclaimerAcknowledgment = typeof disclaimerAcknowledgments.$inferSelect;
export type InsertDisclaimerAcknowledgment = typeof disclaimerAcknowledgments.$inferInsert;


/**
 * ============================================================================
 * BC ENERGY STEP CODE & MULTI-JURISDICTION TABLES
 * For BC Step Code compliance, jurisdiction-specific requirements, and bilingual support
 * ============================================================================
 */

/**
 * Jurisdiction Profiles - Climate, seismic, and code adoption data by province/municipality
 * Enables jurisdiction-specific compliance rules and requirements
 */
export const jurisdictionProfiles = mysqlTable("jurisdictionProfiles", {
  id: int("id").autoincrement().primaryKey(),
  province: mysqlEnum("province", ["AB", "BC", "ON", "SK", "MB"]).notNull(),
  municipality: varchar("municipality", { length: 100 }), // null for provincial defaults
  
  // Climate data
  climateZone: varchar("climateZone", { length: 10 }).notNull(), // "4A", "4B", "5A", "5B", "6A", "6B", "7A", "7B"
  heatingDegreeDays: int("heatingDegreeDays"), // Annual HDD for insulation requirements
  designTemperatureWinter: int("designTemperatureWinter"), // Celsius, for mechanical sizing
  designTemperatureSummer: int("designTemperatureSummer"), // Celsius, for cooling
  
  // Seismic data (primarily BC)
  seismicZone: varchar("seismicZone", { length: 20 }), // "Low", "Intermediate", "High", "Very High"
  spectralAccelerationSa02: decimal("spectralAccelerationSa02", { precision: 4, scale: 3 }), // 0.2s period
  spectralAccelerationSa05: decimal("spectralAccelerationSa05", { precision: 4, scale: 3 }), // 0.5s period
  spectralAccelerationSa10: decimal("spectralAccelerationSa10", { precision: 4, scale: 3 }), // 1.0s period
  
  // Step Code adoption (BC only)
  stepCodeAdopted: boolean("stepCodeAdopted").default(false),
  currentStepCodeTier: mysqlEnum("currentStepCodeTier", ["1", "2", "3", "4", "5"]),
  stepCodeEffectiveDate: date("stepCodeEffectiveDate"),
  
  // NBC adoption
  nbcEdition: varchar("nbcEdition", { length: 20 }).notNull(), // "2020", "2023", "2024", "2025"
  localAmendments: text("localAmendments"), // JSON array of amendment references
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JurisdictionProfile = typeof jurisdictionProfiles.$inferSelect;
export type InsertJurisdictionProfile = typeof jurisdictionProfiles.$inferInsert;

/**
 * Step Code Tiers - TEDI/TEUI targets for BC Energy Step Code compliance
 * Immutable reference data for each tier, building type, and climate zone
 */
export const stepCodeTiers = mysqlTable("stepCodeTiers", {
  id: int("id").autoincrement().primaryKey(),
  tier: mysqlEnum("tier", ["1", "2", "3", "4", "5"]).notNull(),
  buildingType: varchar("buildingType", { length: 50 }).notNull(), // "part9_single_family", "part9_multi_family", "part3_commercial"
  climateZone: varchar("climateZone", { length: 10 }).notNull(), // "4", "5", "6", "7"
  
  // Performance targets
  tediTarget: decimal("tediTarget", { precision: 6, scale: 2 }).notNull(), // kWh/m²/year (Thermal Energy Demand Intensity)
  teuiTarget: decimal("teuiTarget", { precision: 6, scale: 2 }).notNull(), // kWh/m²/year (Thermal Energy Use Intensity)
  
  // Mechanical and envelope requirements
  mechEfficiencyMin: decimal("mechEfficiencyMin", { precision: 4, scale: 2 }), // 0.85, 0.90, 0.95 (AHRI rating)
  airtightnessMax: decimal("airtightnessMax", { precision: 4, scale: 2 }), // ACH50 maximum (air changes per hour at 50 Pa)
  
  // Regulatory reference
  codeReference: varchar("codeReference", { length: 255 }), // e.g., "BC Energy Step Code 2024, Tier 3"
  effectiveDate: date("effectiveDate").notNull(),
  retiredDate: date("retiredDate"), // null if still active
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StepCodeTier = typeof stepCodeTiers.$inferSelect;
export type InsertStepCodeTier = typeof stepCodeTiers.$inferInsert;

/**
 * Energy Features - Extracted envelope and mechanical system data from drawings
 * Stores LLM-extracted and manually-verified energy model inputs
 */
export const energyFeatures = mysqlTable("energyFeatures", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  drawingAnalysisId: int("drawingAnalysisId"), // Reference to drawing analysis if extracted from drawing
  
  // Building envelope
  envelopeArea: decimal("envelopeArea", { precision: 10, scale: 2 }), // m²
  
  // Windows
  windowAreas: text("windowAreas").notNull(), // JSON: [{orientation: "South", area: 50, uValue: 1.8}, ...]
  
  // Walls
  wallAreas: text("wallAreas").notNull(), // JSON: [{type: "above_grade", rValue: 3.5, area: 200}, ...]
  
  // Roof
  roofArea: decimal("roofArea", { precision: 10, scale: 2 }), // m²
  roofRValue: decimal("roofRValue", { precision: 6, scale: 2 }), // RSI value
  
  // Foundation
  foundationType: varchar("foundationType", { length: 50 }), // "basement", "crawl", "slab"
  foundationRValue: decimal("foundationRValue", { precision: 6, scale: 2 }), // RSI value
  
  // Mechanical systems
  mechanicalRoomLocation: varchar("mechanicalRoomLocation", { length: 100 }),
  proposedHeatingSystem: varchar("proposedHeatingSystem", { length: 100 }), // "gas_furnace", "heat_pump", "boiler"
  proposedCoolingSystem: varchar("proposedCoolingSystem", { length: 100 }), // "ac_unit", "none"
  proposedVentilationSystem: varchar("proposedVentilationSystem", { length: 100 }), // "erv", "hrv", "none"
  
  // Special features
  solarReadyZone: boolean("solarReadyZone").default(false),
  evReady: boolean("evReady").default(false),
  
  // Data quality
  extractionConfidence: decimal("extractionConfidence", { precision: 3, scale: 2 }), // 0.0 to 1.0 (from LLM)
  manuallyVerified: boolean("manuallyVerified").default(false),
  verifiedBy: int("verifiedBy"), // User ID who verified
  verifiedAt: timestamp("verifiedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EnergyFeature = typeof energyFeatures.$inferSelect;
export type InsertEnergyFeature = typeof energyFeatures.$inferInsert;

/**
 * Step Code Analyses - Compliance gap analysis results with cryptographic signature
 * Immutable record of Step Code compliance determination
 */
export const stepCodeAnalyses = mysqlTable("stepCodeAnalyses", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  energyFeaturesId: int("energyFeaturesId").notNull(),
  jurisdictionProfileId: int("jurisdictionProfileId").notNull(),
  stepCodeTierId: int("stepCodeTierId").notNull(),
  
  // Performance results
  tierTarget: varchar("tierTarget", { length: 10 }).notNull(), // "3", "4", "5"
  tierAchieved: varchar("tierAchieved", { length: 10 }), // "3", "4", "5", or null if non-compliant
  
  // TEDI/TEUI analysis
  tediTarget: decimal("tediTarget", { precision: 6, scale: 2 }).notNull(),
  tediModelled: decimal("tediModelled", { precision: 6, scale: 2 }).notNull(),
  tediCompliant: boolean("tediCompliant").notNull(),
  tediGap: decimal("tediGap", { precision: 6, scale: 2 }), // Difference (modelled - target)
  
  teuiTarget: decimal("teuiTarget", { precision: 6, scale: 2 }).notNull(),
  teuiModelled: decimal("teuiModelled", { precision: 6, scale: 2 }).notNull(),
  teuiCompliant: boolean("teuiCompliant").notNull(),
  teuiGap: decimal("teuiGap", { precision: 6, scale: 2 }), // Difference (modelled - target)
  
  // Mechanical and envelope compliance
  airtightnessTarget: decimal("airtightnessTarget", { precision: 4, scale: 2 }),
  airtightnessModelled: decimal("airtightnessModelled", { precision: 4, scale: 2 }),
  airtightnessCompliant: boolean("airtightnessCompliant"),
  
  mechEfficiencyTarget: decimal("mechEfficiencyTarget", { precision: 4, scale: 2 }),
  mechEfficiencyModelled: decimal("mechEfficiencyModelled", { precision: 4, scale: 2 }),
  mechEfficiencyCompliant: boolean("mechEfficiencyCompliant"),
  
  // Overall compliance
  overallCompliant: boolean("overallCompliant").notNull(),
  complianceStatus: mysqlEnum("complianceStatus", ["pass", "fail", "conditional"]).notNull(),
  
  // Prescriptive alternative (if performance fails)
  prescriptiveApplicable: boolean("prescriptiveApplicable").default(false),
  prescriptiveDescription: text("prescriptiveDescription"),
  prescriptiveRequirements: text("prescriptiveRequirements"), // JSON array
  
  // Recommendations
  recommendations: text("recommendations"), // JSON array of improvement suggestions
  
  // Cryptographic integrity
  cryptographicSignature: text("cryptographicSignature").notNull(), // SHA-256 HMAC
  signatureVerified: boolean("signatureVerified").default(false).notNull(),
  
  // Audit trail
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  immutable: boolean("immutable").default(true).notNull(),
});

export type StepCodeAnalysis = typeof stepCodeAnalyses.$inferSelect;
export type InsertStepCodeAnalysis = typeof stepCodeAnalyses.$inferInsert;

/**
 * UI Translations - Bilingual support for BC (EN/FR)
 * Enables language toggle for all UI labels, descriptions, and error messages
 */
export const uiTranslations = mysqlTable("uiTranslations", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(), // e.g., "occupancy.assembly", "calculator.tedi.label"
  en: text("en").notNull(), // English translation
  fr: text("fr"), // French translation
  context: varchar("context", { length: 100 }), // e.g., "occupancy", "calculator", "report"
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UITranslation = typeof uiTranslations.$inferSelect;
export type InsertUITranslation = typeof uiTranslations.$inferInsert;

/**
 * Energy Data Extractions - LLM-extracted energy model data from architectural drawings
 * Stage 1 of PD2.0: LLM extraction only (no compliance decisions)
 * Separate from drawingDataExtractions to avoid duplication
 */
export const energyDataExtractions = mysqlTable("energyDataExtractions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  drawingAnalysisId: int("drawingAnalysisId").notNull(),
  
  // Extracted data
  energyFeatures: text("energyFeatures").notNull(), // JSON: window areas, wall R-values, roof specs, etc.
  structuralFeatures: text("structuralFeatures"), // JSON: beam sizes, column spacing, etc.
  
  // Extraction metadata
  modelUsed: varchar("modelUsed", { length: 100 }).notNull(), // e.g., "claude-3-vision-20240314"
  modelVersion: varchar("modelVersion", { length: 50 }),
  extractionConfidence: decimal("extractionConfidence", { precision: 3, scale: 2 }).notNull(), // 0.0 to 1.0
  
  // Audit trail
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EnergyDataExtraction = typeof energyDataExtractions.$inferSelect;
export type InsertEnergyDataExtraction = typeof energyDataExtractions.$inferInsert;

/**
 * Professional Seals - Engineer/Architect credentials for report signing
 * Stores professional information for report seal blocks
 */
export const professionalSeals = mysqlTable("professionalSeals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Professional info
  engineerName: varchar("engineerName", { length: 255 }).notNull(),
  licenseNumber: varchar("licenseNumber", { length: 100 }).notNull(),
  association: varchar("association", { length: 100 }).notNull(), // "EGBC", "AIBC", "APEGA", "AAA"
  associationProvince: varchar("associationProvince", { length: 50 }), // "BC", "AB", "ON"
  
  // Seal image (for PDF reports)
  sealImageUrl: varchar("sealImageUrl", { length: 500 }), // S3 URL
  
  // Validity
  licenseExpiry: date("licenseExpiry"),
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfessionalSeal = typeof professionalSeals.$inferSelect;
export type InsertProfessionalSeal = typeof professionalSeals.$inferInsert;

/**
 * Detected Rooms — AI-extracted room/space data from drawing pages
 */
export const detectedRooms = mysqlTable("detectedRooms", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),        // FK → drawingPages.id
  projectId: int("projectId").notNull(),

  roomLabel: varchar("roomLabel", { length: 255 }),
  boundingBoxJson: json("boundingBoxJson").notNull(),    // { x, y, width, height }
  polygonJson: json("polygonJson"),                      // Array of {x,y} vertices in full-image px
  polygonSource: mysqlEnum("polygonSource", ["flood_fill", "fallback_bbox", "manual", "dda_ray_cast", "roboflow_segmentation"]),
  polygonExtractedAt: timestamp("polygonExtractedAt"),
  polygonToBboxRatio: decimal("polygonToBboxRatio", { precision: 5, scale: 3 }),
  polygonLeakSuspected: tinyint("polygonLeakSuspected").default(0),
  correctionCount: int("correctionCount").default(0),
  lastCorrectedAt: timestamp("lastCorrectedAt"),
  areaSqm: decimal("areaSqm", { precision: 10, scale: 2 }),
  floorLevel: varchar("floorLevel", { length: 100 }),
  occupancyGroup: varchar("occupancyGroup", { length: 10 }),
  occupancyDivision: int("occupancyDivision"),
  confidence: decimal("confidence", { precision: 4, scale: 3 }),
  flagsJson: json("flagsJson"),                          // JSON string[]
  flaggedForReview: tinyint("flaggedForReview").default(0).notNull(),
  manualOverride: tinyint("manualOverride").default(0).notNull(),

  // Phase C — DDA ray cast
  seedX: float("seedX"),
  seedY: float("seedY"),
  doorBarriersJson: json("doorBarriersJson"),            // Array<{x1,y1,x2,y2}>
  detectionMethod: mysqlEnum("detectionMethod", ["flood_fill", "dda_ray_cast", "manual", "fallback_bbox"]).default("flood_fill").notNull(),

  // Sprint 1 — Roboflow accuracy tracking
  roboflowIou: decimal("roboflowIou", { precision: 5, scale: 4 }),      // IoU vs best-matching Roboflow bbox (NULL if RF unavailable)
  roboflowMatched: tinyint("roboflowMatched"),                           // 1=matched, 0=no match, NULL=RF unavailable

  // Thread A — Fire separation adjacency
  adjacentRoomIds: json("adjacentRoomIds"),                              // number[] | null; NULL = not yet computed, [] = computed/no neighbours

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DetectedRoom = typeof detectedRooms.$inferSelect;
export type InsertDetectedRoom = typeof detectedRooms.$inferInsert;

export const roboflowUnmatchedDetections = mysqlTable("roboflowUnmatchedDetections", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  roboflowBboxJson: text("roboflowBboxJson").notNull(),       // JSON {x,y,width,height} in full-image px
  roboflowVerticesJson: text("roboflowVerticesJson").notNull(), // JSON [{x,y},...] polygon vertices
  roboflowConfidence: decimal("roboflowConfidence", { precision: 4, scale: 3 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoboflowUnmatchedDetection = typeof roboflowUnmatchedDetections.$inferSelect;
export type InsertRoboflowUnmatchedDetection = typeof roboflowUnmatchedDetections.$inferInsert;

/**
 * Detected Features — architectural features within detected rooms
 */
export const detectedFeatures = mysqlTable("detectedFeatures", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),        // FK → detectedRooms.id

  featureType: varchar("featureType", { length: 100 }).notNull(),
  positionJson: json("positionJson").notNull(),          // { x, y }
  confidence: decimal("confidence", { precision: 4, scale: 3 }),
  metadataJson: json("metadataJson"),                    // { count, ...extra }

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DetectedFeature = typeof detectedFeatures.$inferSelect;
export type InsertDetectedFeature = typeof detectedFeatures.$inferInsert;

export const complianceResults = mysqlTable('complianceResults', {
  id: int('id').autoincrement().primaryKey(),
  projectId: int('projectId').notNull(),
  roomId: int('roomId'),
  ruleReference: varchar('ruleReference', { length: 50 }).notNull(),
  ruleCategory: varchar('ruleCategory', { length: 50 }).notNull(),
  ruleText: text('ruleText').notNull(),
  status: mysqlEnum('status', ['pass', 'fail', 'warning', 'not_applicable']).notNull(),
  actualValue: varchar('actualValue', { length: 100 }),
  requiredValue: varchar('requiredValue', { length: 100 }),
  remediationSuggestion: text('remediationSuggestion'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  severity: varchar('severity', { length: 20 }),
  constraintId: varchar('constraintId', { length: 100 }),
  overrideChain: json('overrideChain'),
  checkedAt: timestamp('checkedAt').defaultNow(),
});

export type ComplianceResult = typeof complianceResults.$inferSelect;
export type InsertComplianceResult = typeof complianceResults.$inferInsert;

export const complianceMonitorSnapshots = mysqlTable("complianceMonitorSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: varchar("sourceId", { length: 20 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull(),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  contentSample: text("contentSample"),
  fetchedAt: datetime("fetchedAt").notNull(),
  httpStatus: int("httpStatus"),
  errorMessage: text("errorMessage"),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type ComplianceMonitorSnapshot = typeof complianceMonitorSnapshots.$inferSelect;
export type InsertComplianceMonitorSnapshot = typeof complianceMonitorSnapshots.$inferInsert;

export const complianceNotifications = mysqlTable("complianceNotifications", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: varchar("sourceId", { length: 20 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull(),
  changeDetectedAt: datetime("changeDetectedAt").notNull(),
  headline: varchar("headline", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  affectedRuleIds: json("affectedRuleIds"),
  recommendedActions: json("recommendedActions"),
  severity: mysqlEnum("severity", ["critical", "major", "minor", "info"]).notNull().default("info"),
  status: mysqlEnum("status", ["pending", "reviewed", "actioned", "dismissed"]).notNull().default("pending"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: datetime("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type ComplianceNotification = typeof complianceNotifications.$inferSelect;
export type InsertComplianceNotification = typeof complianceNotifications.$inferInsert;

/**
 * Organizations — multi-tenant partitioning for training data and corrections.
 * orgId links users → organizations for org-level personalization.
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  planTier: mysqlEnum("planTier", ["basic", "professional", "enterprise"]).notNull().default("professional"),
  trainingExampleCount: int("trainingExampleCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Room Corrections — Phase 5B admin correction records.
 * orgId partitions corrections by organization; NULL = CodeComply global.
 */
export const roomCorrections = mysqlTable("roomCorrections", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  pageId: int("pageId").notNull(),
  correctedBy: int("correctedBy").notNull(),
  orgId: int("orgId"),
  correctedAt: timestamp("correctedAt").defaultNow().notNull(),
  correctionType: mysqlEnum("correctionType", [
    "label_rename",
    "occupancy_change",
    "boundary_redraw",
    "false_positive_delete",
    "missing_room_add",
  ]).notNull(),
  previousValueJson: json("previousValueJson"),
  correctedValueJson: json("correctedValueJson").notNull(),
  planType: varchar("planType", { length: 50 }),
  addedToTraining: tinyint("addedToTraining").default(1),
  trainingWeight: decimal("trainingWeight", { precision: 3, scale: 2 }).default("1.00"),
  notes: text("notes"),
});

export type RoomCorrection = typeof roomCorrections.$inferSelect;
export type InsertRoomCorrection = typeof roomCorrections.$inferInsert;

/**
 * Training Examples — org-specific and global-baseline prompt contributions.
 * orgId = NULL means CodeComply-curated global baseline (visible to all orgs).
 * orgId = INT means org-specific (used only for that org's analyses).
 */
export const trainingExamples = mysqlTable("trainingExamples", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId"),
  planType: varchar("planType", { length: 50 }).notNull(),
  correctionId: int("correctionId").notNull(),
  imageCropBase64: mediumtext("imageCropBase64"),
  promptContribution: text("promptContribution").notNull(),
  conventionType: mysqlEnum("conventionType", [
    "label_convention",
    "symbol_convention",
    "layout_convention",
    "equipment_convention",
    "occupancy_convention",
    "correction",
  ]).notNull().default("correction"),
  isActive: tinyint("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  exportedAt: timestamp("exportedAt"),
  roboflowImageId: varchar("roboflowImageId", { length: 255 }),
});

export type TrainingExample = typeof trainingExamples.$inferSelect;
export type InsertTrainingExample = typeof trainingExamples.$inferInsert;

/**
 * CodeComply Home — consumer pay-per-report records.
 * Rev 2 security: reportToken stores SHA-256 hash only — raw token lives in email link.
 * userId links to users table when optional account is created post-payment (Fix 3).
 * pdfStorageKey is the S3 object key; never a public URL.
 */
export const homeReports = mysqlTable("homeReports", {
  id: int("id").autoincrement().primaryKey(),
  reportToken: varchar("reportToken", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  userId: int("userId"),
  province: mysqlEnum("province", ["AB", "BC", "ON"]).notNull(),
  municipality: varchar("municipality", { length: 100 }),
  projectType: varchar("projectType", { length: 50 }).notNull(),
  formAnswersJson: json("formAnswersJson").notNull(),
  complianceResultJson: json("complianceResultJson"),
  overallResult: mysqlEnum("overallResult", ["pass", "conditional", "fail"]),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending"),
  pdfStorageKey: varchar("pdfStorageKey", { length: 500 }),
  reportGeneratedAt: timestamp("reportGeneratedAt"),
  downloadExpiresAt: timestamp("downloadExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HomeReport = typeof homeReports.$inferSelect;
export type InsertHomeReport = typeof homeReports.$inferInsert;

export const codeStrategies = mysqlTable("codeStrategies", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  orgId: int("orgId"),
  createdBy: int("createdBy").notNull(),
  province: varchar("province", { length: 5 }).notNull(),
  codeEdition: varchar("codeEdition", { length: 20 }).notNull(),
  constructionType: varchar("constructionType", { length: 10 }).notNull(),
  sprinklered: tinyint("sprinklered").default(0),
  buildingHeightM: decimal("buildingHeightM", { precision: 6, scale: 2 }),
  buildingAreaM2: decimal("buildingAreaM2", { precision: 10, scale: 2 }),
  storeys: int("storeys"),
  occupancyGroups: json("occupancyGroups"),
  egressStrategy: text("egressStrategy"),
  exitCount: int("exitCount"),
  separationRequired: tinyint("separationRequired").default(0),
  strategySummaryJson: json("strategySummaryJson"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  status: mysqlEnum("status", ["draft", "approved", "superseded"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodeStrategy = typeof codeStrategies.$inferSelect;
export type InsertCodeStrategy = typeof codeStrategies.$inferInsert;

export const permitReviews = mysqlTable("permitReviews", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  orgId: int("orgId").notNull(),
  reviewedBy: int("reviewedBy").notNull(),
  reviewType: mysqlEnum("reviewType", ["code_strategy", "calculations", "permit_package"]).notNull(),
  decision: mysqlEnum("decision", ["approved", "revision_requested", "rejected"]).notNull(),
  notes: text("notes"),
  submittedDate: date("submittedDate"),
  permitApplicationNumber: varchar("permitApplicationNumber", { length: 100 }),
  reviewingAuthority: varchar("reviewingAuthority", { length: 200 }),
  submissionStatus: mysqlEnum("submissionStatus", ["not_submitted", "submitted", "under_review", "approved", "rejected"]).default("not_submitted"),
  permitNumber: varchar("permitNumber", { length: 100 }),
  reviewedAt: timestamp("reviewedAt").defaultNow().notNull(),
});

export type PermitReview = typeof permitReviews.$inferSelect;
export type InsertPermitReview = typeof permitReviews.$inferInsert;

export const calculationsPackages = mysqlTable("calculationsPackages", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  orgId: int("orgId"),
  createdBy: int("createdBy").notNull(),
  drawingAnalysisId: int("drawingAnalysisId"),
  codeStrategyId: int("codeStrategyId"),
  province: varchar("province", { length: 5 }).notNull(),
  codeEdition: varchar("codeEdition", { length: 20 }).notNull(),
  sprinklered: tinyint("sprinklered").default(0),
  occupantLoadByGroup: json("occupantLoadByGroup"),
  totalOccupantLoad: int("totalOccupantLoad"),
  exitWidthRequiredMm: decimal("exitWidthRequiredMm", { precision: 8, scale: 2 }),
  travelDistanceResults: json("travelDistanceResults"),
  areaByFloor: json("areaByFloor"),
  totalAreaM2: decimal("totalAreaM2", { precision: 10, scale: 2 }),
  nbcTableRef: varchar("nbcTableRef", { length: 50 }),
  calculationsSummaryJson: json("calculationsSummaryJson"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  status: mysqlEnum("status", ["draft", "approved", "superseded"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalculationsPackage = typeof calculationsPackages.$inferSelect;
export type InsertCalculationsPackage = typeof calculationsPackages.$inferInsert;

export const drawingSetContexts = mysqlTable("drawingSetContexts", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  drawingAnalysisId: int("drawingAnalysisId").default(0).notNull(),

  projectName: varchar("projectName", { length: 200 }),
  projectAddress: varchar("projectAddress", { length: 300 }),
  architectFirm: varchar("architectFirm", { length: 200 }),
  clientName: varchar("clientName", { length: 200 }),

  buildingOccupancy: varchar("buildingOccupancy", { length: 50 }),
  numberOfStoreys: int("numberOfStoreys"),
  constructionType: varchar("constructionType", { length: 100 }),
  sprinklered: tinyint("sprinklered").default(0),
  basementPresent: tinyint("basementPresent").default(0),

  codeEdition: varchar("codeEdition", { length: 50 }),
  municipality: varchar("municipality", { length: 100 }),
  province: varchar("province", { length: 5 }),

  totalPages: int("totalPages"),
  pageInventoryJson: json("pageInventoryJson"),
  floorHierarchyJson: json("floorHierarchyJson"),

  confirmedScale: varchar("confirmedScale", { length: 50 }),
  overallWidthM: decimal("overallWidthM", { precision: 8, scale: 2 }),
  overallDepthM: decimal("overallDepthM", { precision: 8, scale: 2 }),
  typicalCeilingHeightM: decimal("typicalCeilingHeightM", { precision: 6, scale: 2 }),

  abbreviationsJson: json("abbreviationsJson"),
  exitLocationsJson: json("exitLocationsJson"),
  stairLocationsJson: json("stairLocationsJson"),

  doorScheduleJson: json("doorScheduleJson"),
  windowScheduleJson: json("windowScheduleJson"),
  schedulePageNumbers: json("schedulePageNumbers"),
  totalDoorTypes: int("totalDoorTypes").default(0),
  totalWindowTypes: int("totalWindowTypes").default(0),

  currentRevision: varchar("currentRevision", { length: 20 }),
  revisionDate: date("revisionDate"),

  rawContextJson: json("rawContextJson"),

  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
  extractedBy: int("extractedBy"),
});

export type DrawingSetContext = typeof drawingSetContexts.$inferSelect;
export type InsertDrawingSetContext = typeof drawingSetContexts.$inferInsert;

export const siteAnalyses = mysqlTable("siteAnalyses", {
  id:              int("id").autoincrement().primaryKey(),
  projectId:       int("projectId").notNull(),
  lotWidthM:       decimal("lotWidthM",       { precision: 8,  scale: 2 }),
  lotDepthM:       decimal("lotDepthM",       { precision: 8,  scale: 2 }),
  lotAreaSqm:      decimal("lotAreaSqm",      { precision: 10, scale: 2 }),
  buildingWidthM:  decimal("buildingWidthM",  { precision: 8,  scale: 2 }),
  buildingDepthM:  decimal("buildingDepthM",  { precision: 8,  scale: 2 }),
  buildingHeightM: decimal("buildingHeightM", { precision: 8,  scale: 2 }),
  frontSetbackM:   decimal("frontSetbackM",   { precision: 6,  scale: 2 }),
  rearSetbackM:    decimal("rearSetbackM",    { precision: 6,  scale: 2 }),
  sideSetbackM:    decimal("sideSetbackM",    { precision: 6,  scale: 2 }),
  siteCoveragePct: decimal("siteCoveragePct", { precision: 5,  scale: 2 }),
  isCompliant:          boolean("isCompliant").default(false),
  zoneCode:             varchar("zoneCode",     { length: 50 }),
  municipality:         varchar("municipality", { length: 100 }),
  accessoryWidthM:      decimal("accessoryWidthM",      { precision: 8, scale: 2 }),
  accessoryDepthM:      decimal("accessoryDepthM",      { precision: 8, scale: 2 }),
  accessoryHeightM:     decimal("accessoryHeightM",     { precision: 8, scale: 2 }),
  accessoryAreaSqm:     decimal("accessoryAreaSqm",     { precision: 8, scale: 2 }),
  accessoryIsCompliant: boolean("accessoryIsCompliant"),
  source:               varchar("source", { length: 50 }).default("manual"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteAnalysis = typeof siteAnalyses.$inferSelect;
export type InsertSiteAnalysis = typeof siteAnalyses.$inferInsert;

export const fireAssemblies = mysqlTable("fireAssemblies", {
  id:                int("id").autoincrement().primaryKey(),
  drawingAnalysisId: int("drawingAnalysisId").notNull(),
  pageId:            int("pageId").notNull(),
  projectId:         int("projectId").notNull(),
  assemblyType:      mysqlEnum("assemblyType", ["none","0.5hr","1hr","1.5hr","2hr","fire_separation"]).notNull(),
  frrDrawn:          decimal("frrDrawn",    { precision: 4, scale: 2 }).notNull(),
  frrRequired:       decimal("frrRequired", { precision: 4, scale: 2 }),
  isCompliant:       boolean("isCompliant"),
  gap:               decimal("gap",         { precision: 4, scale: 2 }),
  roomAId:           int("roomAId"),
  roomBId:           int("roomBId"),
  occupancyA:        varchar("occupancyA",  { length: 10 }),
  occupancyB:        varchar("occupancyB",  { length: 10 }),
  labelA:            varchar("labelA",      { length: 100 }),
  labelB:            varchar("labelB",      { length: 100 }),
  lengthPx:          decimal("lengthPx",    { precision: 10, scale: 2 }),
  lengthM:           decimal("lengthM",     { precision: 8,  scale: 2 }),
  wallHeightM:       decimal("wallHeightM", { precision: 6,  scale: 2 }).default("2.74"),
  pointsJson:        json("pointsJson").notNull(),
  nbcReference:      varchar("nbcReference", { length: 50 }).default("NBC Table 3.1.3.4"),
  remediationJson:   json("remediationJson"),
  assemblyLabel:     varchar("assemblyLabel", { length: 10 }),
  wallCode:          varchar("wallCode",      { length: 30 }),
  wallName:          varchar("wallName",      { length: 200 }),
  sequenceNum:       int("sequenceNum").notNull().default(1),
  isStacked:         tinyint("isStacked").notNull().default(0),
  stackedWithId:     int("stackedWithId"),
  stackSuffix:       varchar("stackSuffix",  { length: 1 }),
  effectiveFrr:      decimal("effectiveFrr", { precision: 4, scale: 2 }),
  wallCodeFormat:    varchar("wallCodeFormat",{ length: 20 }).notNull().default("FW"),
  ulcDesign:         varchar("ulcDesign",    { length: 50 }),
  assemblyDesc:      varchar("assemblyDesc", { length: 200 }),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FireAssembly = typeof fireAssemblies.$inferSelect;
export type InsertFireAssembly = typeof fireAssemblies.$inferInsert;

// ── APS / BuildingConnected ──────────────────────────────────────────────────

export const apsConnections = mysqlTable("apsConnections", {
  id:             int("id").autoincrement().primaryKey(),
  userId:         int("userId").notNull(),
  accessToken:    text("accessToken"),
  refreshToken:   text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  apsAccountId:   varchar("apsAccountId", { length: 100 }),
  companyName:    varchar("companyName",  { length: 200 }),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const bcProjectLinks = mysqlTable("bcProjectLinks", {
  id:                  int("id").autoincrement().primaryKey(),
  userId:              int("userId").notNull(),
  bcProjectId:         varchar("bcProjectId",   { length: 100 }).notNull(),
  bcProjectName:       varchar("bcProjectName", { length: 200 }),
  apsProjectId:        varchar("apsProjectId",  { length: 100 }),
  codeComplyProjectId: int("codeComplyProjectId"),
  autoCheckEnabled:    tinyint("autoCheckEnabled").notNull().default(1),
  lastCheckedAt:       timestamp("lastCheckedAt"),
  lastReportId:        varchar("lastReportId",  { length: 200 }),
  issueCount:          int("issueCount").default(0),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

