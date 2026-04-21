import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date, decimal, tinyint } from "drizzle-orm/mysql-core";

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
  province: varchar("province", { length: 5 }), // "AB" | "BC" | "ON" | etc.
  climateZone: varchar("climateZone", { length: 10 }), // "4", "5", "6", "7A", "7B", "8"
  seismicZone: varchar("seismicZone", { length: 20 }), // "Low" | "Intermediate" | "High" | "Very High"
  buildingType: varchar("buildingType", { length: 50 }), // "part9_single_family" | "part9_multiplex" | etc.
  stepCodeTier: varchar("stepCodeTier", { length: 5 }), // "1"-"5", BC only
  jurisdictionDetected: boolean("jurisdictionDetected").default(false),
  projectCode: varchar("projectCode", { length: 50 }), // user-entered code e.g. "CCC21", "ABC-2024"
  projectNumber: varchar("projectNumber", { length: 20 }), // auto-generated e.g. "CC-2025-001"
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

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
  drawingUrl: text("drawingUrl").notNull(),
  drawingHash: varchar("drawingHash", { length: 64 }).notNull(), // SHA-256, computed at upload time (PD2.0 §4.2)
  drawingSnapshotKey: varchar("drawingSnapshotKey", { length: 500 }),
  drawingSnapshotMimeType: varchar("drawingSnapshotMimeType", { length: 50 }),
  drawingSnapshotSize: int("drawingSnapshotSize"),
  analysisType: mysqlEnum("analysisType", ["structural", "fire-safety", "connections", "comprehensive"]),
  analysisStatus: mysqlEnum("analysisStatus", ["DRAFT", "UNDER_REVIEW", "VALID", "REJECTED"]).notNull().default("DRAFT"),
  complianceScore: int("complianceScore"),
  complianceLevel: mysqlEnum("complianceLevel", ["approved", "conditional", "revision", "rejected"]),
  structuralStatus: text("structuralStatus"), // JSON
  fireSafetyStatus: text("fireSafetyStatus"), // JSON
  connectionStatus: text("connectionStatus"), // JSON
  issues: text("issues"), // JSON array
  recommendations: text("recommendations"), // JSON array
  disclaimerAcknowledged: boolean("disclaimerAcknowledged").notNull().default(false),
  disclaimerAcknowledgedAt: timestamp("disclaimerAcknowledgedAt"),
  disclaimerVersion: varchar("disclaimerVersion", { length: 20 }).notNull(),
  llmModelVersion: varchar("llmModelVersion", { length: 50 }), // From response.model (PD2.0 §3.2)
  ruleEngineVersion: varchar("ruleEngineVersion", { length: 20 }),
  validatedAt: timestamp("validatedAt"),
  validatedByUserId: int("validatedByUserId"),
  validatedByLicenseNumber: varchar("validatedByLicenseNumber", { length: 100 }),
  validatedByAssociation: varchar("validatedByAssociation", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrawingAnalysis = typeof drawingAnalyses.$inferSelect;
export type InsertDrawingAnalysis = typeof drawingAnalyses.$inferInsert;

/**
 * Drawing Data Extractions - Stage 1 output (LLM extraction only)
 * Per PD2.0 §4.1: This is the ONLY place LLM output is stored
 * LLM output is Zod-validated structured data, NOT compliance decisions
 */
export const drawingDataExtractions = mysqlTable("drawingDataExtractions", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  extractedData: text("extractedData").notNull(), // JSON - Zod-validated DrawingData
  extractionModel: varchar("extractionModel", { length: 50 }).notNull(), // From response.model
  extractionPromptVersion: varchar("extractionPromptVersion", { length: 20 }).notNull(),
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
  userEmail: varchar("userEmail", { length: 255 }).notNull(),
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
