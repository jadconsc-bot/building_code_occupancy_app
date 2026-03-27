import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, date, numeric, json, unique } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: pgEnum("role", ["user", "admin"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User bookmarks for occupancy codes
 */
export const bookmarks = pgTable("bookmarks", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  occupancyCode: varchar("occupancyCode", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * User notes for occupancy codes
 */
export const notes = pgTable("notes", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  occupancyCode: varchar("occupancyCode", { length: 10 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * User feedback submissions for beta testing
 */
export const feedbacks = pgTable("feedbacks", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  rating: integer("rating").notNull(), // 1-5 star rating
  feedbackType: pgEnum("feedbackType", ["bug", "feature", "improvement", "other"]).notNull(),
  category: varchar("category", { length: 50 }), // e.g., "calculators", "ui", "data-accuracy"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  currentPage: varchar("currentPage", { length: 255 }), // URL or page identifier
  browserInfo: text("browserInfo"), // User agent string
  resolved: integer("resolved").default(0).notNull(), // 0 = open, 1 = resolved
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

/**
 * Projects for building code compliance tracking
 */
export const projects = pgTable("projects", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  occupancyCode: varchar("occupancyCode", { length: 10 }).notNull(),
  template: varchar("template", { length: 50 }), // e.g., "residential", "commercial", "industrial"
  notes: text("notes"),
  status: pgEnum("status", ["active", "completed", "archived"]).notNull(),
  overallProgress: integer("overallProgress").default(0).notNull(), // 0-100 percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Calculator results linked to projects
 */
export const projectCalculatorResults = pgTable("projectCalculatorResults", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  calculatorType: varchar("calculatorType", { length: 50 }).notNull(), // e.g., "occupantLoad", "fireExit", "stairDesign"
  inputData: text("inputData").notNull(), // JSON string of calculator inputs
  resultData: text("resultData").notNull(), // JSON string of calculation results
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProjectCalculatorResult = typeof projectCalculatorResults.$inferSelect;
export type InsertProjectCalculatorResult = typeof projectCalculatorResults.$inferInsert;

/**
 * Checklist items linked to projects
 */
export const projectChecklistItems = pgTable("projectChecklistItems", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  phase: varchar("phase", { length: 50 }).notNull(), // e.g., "design", "permitting", "construction", "inspection"
  itemId: varchar("itemId", { length: 100 }).notNull(), // Unique identifier for the item
  itemText: text("itemText").notNull(),
  isCompleted: integer("isCompleted").default(0).notNull(), // 0 = false, 1 = true
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  photoUrl: varchar("photoUrl", { length: 500 }), // S3 URL for photo evidence
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProjectChecklistItem = typeof projectChecklistItems.$inferSelect;
export type InsertProjectChecklistItem = typeof projectChecklistItems.$inferInsert;


/**
 * Versioned rulesets for compliance engine
 * Each ruleset is immutable and tied to a specific code edition
 */
export const rulesets = pgTable("rulesets", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Ruleset = typeof rulesets.$inferSelect;
export type InsertRuleset = typeof rulesets.$inferInsert;

/**
 * Immutable compliance snapshots
 * Frozen results tied to a specific ruleset version
 */
export const complianceSnapshots = pgTable("complianceSnapshots", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  snapshotId: varchar("snapshotId", { length: 100 }).notNull().unique(), // UUID
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(), // Reference to rulesets table
  mode: pgEnum("mode", ["strict", "soft"]).notNull(),
  inputs: text("inputs").notNull(), // JSON of all inputs
  outputs: text("outputs").notNull(), // JSON of all outputs
  ruleTrace: text("ruleTrace").notNull(), // JSON array of which rules fired
  complianceStatus: pgEnum("complianceStatus", ["compliant", "non_compliant", "conditional"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComplianceSnapshot = typeof complianceSnapshots.$inferSelect;
export type InsertComplianceSnapshot = typeof complianceSnapshots.$inferInsert;

/**
 * Rule changelog for governance and audit
 */
export const ruleChangelog = pgTable("ruleChangelog", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  changeType: pgEnum("changeType", ["added", "modified", "deprecated", "removed"]).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  clause: varchar("clause", { length: 50 }).notNull(),
  description: text("description").notNull(),
  reason: text("reason"),
  approvedBy: integer("approvedBy"), // User ID of approver
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RuleChange = typeof ruleChangelog.$inferSelect;
export type InsertRuleChange = typeof ruleChangelog.$inferInsert;

/**
 * Audit log for all compliance analyses
 */
export const auditLog = pgTable("auditLog", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  projectId: integer("projectId"),
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
export const ruleTests = pgTable("ruleTests", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  inputs: text("inputs").notNull(), // JSON of test inputs
  expectedOutputs: text("expectedOutputs").notNull(), // JSON of expected outputs
  passed: integer("passed").default(0).notNull(), // 0 = failed, 1 = passed
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RuleTest = typeof ruleTests.$inferSelect;
export type InsertRuleTest = typeof ruleTests.$inferInsert;


/**
 * Rule Editor Roles and Credentials
 * Tracks professional credentials and authority levels for rule updates
 */
export const ruleEditorRoles = pgTable("ruleEditorRoles", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull().unique(),
  role: pgEnum("role", ["viewer", "editor", "reviewer", "admin"]).notNull(),
  profession: varchar("profession", { length: 100 }), // e.g., "Architect", "Engineer", "Building Official"
  licenseNumber: varchar("licenseNumber", { length: 100 }).unique(),
  licenseProvince: varchar("licenseProvince", { length: 50 }), // e.g., "Alberta", "Ontario"
  licenseExpiry: timestamp("licenseExpiry"),
  credentials: text("credentials"), // JSON with credential details
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: integer("verifiedBy"), // Admin user who verified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RuleEditorRole = typeof ruleEditorRoles.$inferSelect;
export type InsertRuleEditorRole = typeof ruleEditorRoles.$inferInsert;

/**
 * Rule Change Requests
 * Tracks proposed rule changes awaiting admin approval
 */
export const ruleChangeRequests = pgTable("ruleChangeRequests", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  requestedBy: integer("requestedBy").notNull(), // User ID of editor
  changeType: pgEnum("changeType", ["create", "update", "delete", "deprecate"]).notNull(),
  currentValue: text("currentValue"), // JSON of current rule
  proposedValue: text("proposedValue"), // JSON of proposed rule
  justification: text("justification").notNull(), // Why this change is needed
  codeReference: varchar("codeReference", { length: 255 }), // e.g., "NBC 3.2.2.47"
  status: pgEnum("status", ["pending", "approved", "rejected", "implemented"]).notNull(),
  approvedBy: integer("approvedBy"), // Admin user ID
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
export const ruleChangeAudit = pgTable("ruleChangeAudit", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  changeRequestId: integer("changeRequestId").notNull(),
  rulesetId: varchar("rulesetId", { length: 100 }).notNull(),
  ruleId: varchar("ruleId", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // "requested", "approved", "rejected", "implemented"
  actor: integer("actor").notNull(), // User ID performing action
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
export const ruleChangeNotifications = pgTable("ruleChangeNotifications", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  changeRequestId: integer("changeRequestId").notNull(),
  recipientId: integer("recipientId").notNull(), // User ID to notify
  notificationType: pgEnum("notificationType", ["change_requested", "change_approved", "change_rejected", "change_implemented"]).notNull(),
  read: integer("read").default(0).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RuleChangeNotification = typeof ruleChangeNotifications.$inferSelect;
export type InsertRuleChangeNotification = typeof ruleChangeNotifications.$inferInsert;

/**
 * Digital Signatures for Rule Changes
 * Cryptographic signatures for legal defensibility
 */
export const digitalSignatures = pgTable("digitalSignatures", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  changeRequestId: integer("changeRequestId").notNull(),
  signedBy: integer("signedBy").notNull(), // User ID
  signatureType: varchar("signatureType", { length: 50 }).notNull(), // "approval", "implementation"
  publicKey: text("publicKey"), // PEM format
  signature: text("signature").notNull(), // Base64 encoded signature
  certificateChain: text("certificateChain"), // PEM format certificate chain
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verificationStatus: pgEnum("verificationStatus", ["pending", "verified", "failed"]).notNull(),
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
export const calculationResults = pgTable("calculationResults", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  calculatorType: varchar("calculatorType", { length: 50 }).notNull(),
  rulesetVersion: varchar("rulesetVersion", { length: 50 }).notNull(),
  inputData: text("inputData").notNull(),
  resultData: text("resultData").notNull(),
  calculationTrace: text("calculationTrace"),
  cryptographicSignature: text("cryptographicSignature").notNull(),
  certificateChain: text("certificateChain"),
  signatureVerified: boolean("signatureVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: integer("createdBy").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  immutable: boolean("immutable").default(true).notNull(),
});

export type CalculationResult = typeof calculationResults.$inferSelect;
export type InsertCalculationResult = typeof calculationResults.$inferInsert;

/**
 * Calculation Audit Log - Complete history of all calculation actions
 */
export const calculationAuditLog = pgTable("calculationAuditLog", {
  id: varchar("id", { length: 36 }).primaryKey(),
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  actor: integer("actor").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

export type CalculationAuditLogEntry = typeof calculationAuditLog.$inferSelect;
export type InsertCalculationAuditLogEntry = typeof calculationAuditLog.$inferInsert;

/**
 * Versioned Rulesets - Immutable copies of calculation rules
 */
export const calculationRulesets = pgTable("calculationRulesets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  effectiveDate: date("effectiveDate").notNull(),
  retiredDate: date("retiredDate"),
  rulesJSON: text("rulesJSON").notNull(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: integer("createdBy").notNull(),
  description: text("description"),
});

export type CalculationRuleset = typeof calculationRulesets.$inferSelect;
export type InsertCalculationRuleset = typeof calculationRulesets.$inferInsert;

/**
 * Digital Certificates - PKI infrastructure for cryptographic signing
 */
export const calculationCertificates = pgTable("calculationCertificates", {
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
export const calculationChallenges = pgTable("calculationChallenges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  challengedBy: integer("challengedBy").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: pgEnum("status", ["open", "investigating", "resolved", "dismissed"]).notNull(),
  resolution: text("resolution"),
  resolvedBy: integer("resolvedBy"),
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
export const clients = pgTable("clients", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(), // Primary contact/owner
  firmId: integer("firmId"), // If part of a firm
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 50 }),
  postalCode: varchar("postalCode", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }),
  industry: varchar("industry", { length: 100 }), // e.g., "residential", "commercial", "industrial"
  status: pgEnum("status", ["active", "inactive", "archived"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Project Members - Team collaboration on projects
 * Tracks who has access to which projects and their roles
 */
export const projectMembers = pgTable("projectMembers", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  role: pgEnum("role", ["owner", "editor", "reviewer", "viewer"]).notNull(),
  permissions: text("permissions"), // JSON array of specific permissions
  addedBy: integer("addedBy").notNull(), // User who added this member
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  removedAt: timestamp("removedAt"), // null if still active
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * Team Roles - Define custom roles for firms
 * Allows firms to create role templates
 */
export const teamRoles = pgTable("teamRoles", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  firmId: integer("firmId").notNull(), // Firm this role belongs to
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  permissions: text("permissions").notNull(), // JSON array of permissions
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const subscriptionPlans = pgTable("subscriptionPlans", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Individual", "Consultant", "Firm"
  description: text("description"),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearlyPrice", { precision: 10, scale: 2 }),
  features: text("features").notNull(), // JSON array of feature names
  maxProjects: integer("maxProjects"), // null for unlimited
  maxUsers: integer("maxUsers"), // null for unlimited
  maxClients: integer("maxClients"), // null for unlimited
  canGenerateReports: boolean("canGenerateReports").default(false).notNull(),
  canShareProjects: boolean("canShareProjects").default(false).notNull(),
  canCollaborate: boolean("canCollaborate").default(false).notNull(),
  supportLevel: varchar("supportLevel", { length: 50 }), // "email", "priority", "dedicated"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User Subscriptions - Track which users have which plans
 */
export const userSubscriptions = pgTable("userSubscriptions", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull().unique(),
  planId: integer("planId").notNull(),
  status: pgEnum("status", ["active", "paused", "cancelled", "expired"]).notNull(),
  billingCycle: pgEnum("billingCycle", ["monthly", "yearly"]).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelledAt: timestamp("cancelledAt"),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }), // Stripe subscription ID
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe customer ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Usage Metrics - Track feature usage for ROI visibility
 */
export const usageMetrics = pgTable("usageMetrics", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  projectsCreated: integer("projectsCreated").default(0).notNull(),
  calculationsRun: integer("calculationsRun").default(0).notNull(),
  reportsGenerated: integer("reportsGenerated").default(0).notNull(),
  projectsShared: integer("projectsShared").default(0).notNull(),
  hoursEstimatedSaved: decimal("hoursEstimatedSaved", { precision: 10, scale: 2 }).default("0").notNull(),
  riskReductionScore: decimal("riskReductionScore", { precision: 5, scale: 2 }).default("0").notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const shareLinks = pgTable("shareLinks", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  projectId: integer("projectId").notNull(),
  createdBy: integer("createdBy").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(), // Random token for URL
  accessLevel: pgEnum("accessLevel", ["view_only", "comment", "download"]).notNull(),
  expiresAt: timestamp("expiresAt"), // null for never expires
  maxAccessCount: integer("maxAccessCount"), // null for unlimited
  accessCount: integer("accessCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = typeof shareLinks.$inferInsert;

/**
 * Share Link Access Log - Track who accessed shared projects
 */
export const shareLinkAccessLog = pgTable("shareLinkAccessLog", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  shareLinkId: varchar("shareLinkId", { length: 36 }).notNull(),
  accessedAt: timestamp("accessedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  accessedBy: integer("accessedBy"), // null if anonymous
});

export type ShareLinkAccessLog = typeof shareLinkAccessLog.$inferSelect;
export type InsertShareLinkAccessLog = typeof shareLinkAccessLog.$inferInsert;

/**
 * Verification Tokens - For public verification portal
 */
export const verificationTokens = pgTable("verificationTokens", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  isPublic: boolean("isPublic").default(false).notNull(),
  expiresAt: timestamp("expiresAt"), // null for never expires
  viewCount: integer("viewCount").default(0).notNull(),
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
export const calculationVersions = pgTable("calculationVersions", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  versionNumber: integer("versionNumber").notNull(),
  parentVersionId: varchar("parentVersionId", { length: 36 }), // Previous version
  inputData: text("inputData").notNull(), // JSON
  resultData: text("resultData").notNull(), // JSON
  changeReason: text("changeReason"), // Why this version was created
  changedBy: integer("changedBy").notNull(),
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
export const requestLogs = pgTable("requestLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: integer("userId"),
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, etc.
  path: varchar("path", { length: 500 }).notNull(),
  statusCode: integer("statusCode").notNull(),
  duration: integer("duration").notNull(), // milliseconds
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
export const signatureLogs = pgTable("signatureLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  operation: varchar("operation", { length: 50 }).notNull(), // "sign", "verify"
  status: pgEnum("status", ["success", "failure", "rejected"]).notNull(),
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
export const calculationLogs = pgTable("calculationLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  calculationResultId: varchar("calculationResultId", { length: 36 }).notNull(),
  calculatorType: varchar("calculatorType", { length: 50 }).notNull(),
  stage: varchar("stage", { length: 50 }).notNull(), // "validation", "execution", "signing"
  message: text("message").notNull(),
  level: pgEnum("level", ["debug", "info", "warn", "error"]).notNull(),
  details: text("details"), // JSON with additional context
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type CalculationLog = typeof calculationLogs.$inferSelect;
export type InsertCalculationLog = typeof calculationLogs.$inferInsert;


/**
 * ============================================================================
 * WEEK 1: AUDIT TRAIL TABLES (SaaS UPGRADE)
 * For compliance audit trails, digital signatures, and modification tracking
 * ============================================================================
 */

/**
 * Compliance Audit Log - Complete immutable audit trail of all compliance analyses
 * Tracks every compliance evaluation for regulatory compliance and legal defensibility
 */
export const complianceAuditLog = pgTable("complianceAuditLog", {
  id: varchar("id", { length: 50 }).primaryKey(), // UUID
  projectId: integer("projectId").notNull(),
  projectName: varchar("projectName", { length: 255 }),
  
  // Engineer info - links to users table
  engineerId: integer("engineerId").notNull(),
  engineerName: varchar("engineerName", { length: 100 }),
  engineerLicense: varchar("engineerLicense", { length: 50 }),
  engineerEmail: varchar("engineerEmail", { length: 255 }),
  
  // Timing
  timestamp: timestamp("timestamp").defaultNow(),
  dateCompleted: timestamp("dateCompleted"),
  
  // Code compliance
  codeVersion: varchar("codeVersion", { length: 20 }).notNull().default("NBC_2025"),
  jurisdiction: varchar("jurisdiction", { length: 50 }).default("Canada"),
  
  // Rules that were evaluated (JSON from complianceEngine)
  rulesEvaluated: text("rulesEvaluated").notNull(), // JSON array as string
  projectData: text("projectData").notNull(), // JSON as string
  
  // Results from complianceEngine
  totalRulesEvaluated: integer("totalRulesEvaluated"),
  totalRulesPassed: integer("totalRulesPassed"),
  totalRulesFailed: integer("totalRulesFailed"),
  compliancePercentage: decimal("compliancePercentage", { precision: 5, scale: 2 }),
  overallStatus: varchar("overallStatus", { length: 20 }), // COMPLIANT, NON_COMPLIANT, CONDITIONAL
  
  // Digital signature
  signatureImage: text("signatureImage"), // Base64 PNG
  signatureTimestamp: timestamp("signatureTimestamp"),
  signatureHash: varchar("signatureHash", { length: 500 }), // SHA256 for tamper-detection
  
  // Legal defensibility
  isDefendable: boolean("isDefendable").default(true),
  hasAllRules: boolean("hasAllRules").default(true),
  isComprehensive: boolean("isComprehensive").default(true),
  
  // Standard assumptions/limitations
  assumptions: text("assumptions"), // JSON string array
  limitations: text("limitations"), // JSON string array
  notes: text("notes"),
  
  // Security metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: varchar("status", { length: 20 }).default("COMPLETED"), // DRAFT, COMPLETED, SIGNED
  isArchived: boolean("isArchived").default(false),
  
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt"),
});

export type ComplianceAuditLog = typeof complianceAuditLog.$inferSelect;
export type InsertComplianceAuditLog = typeof complianceAuditLog.$inferInsert;

/**
 * Audit Modification History - Track all changes to compliance data
 * Complete history of modifications for traceability and compliance
 */
export const auditModificationHistory = pgTable("auditModificationHistory", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  auditId: varchar("auditId", { length: 50 }).notNull(),
  modifiedAt: timestamp("modifiedAt").defaultNow(),
  modifiedBy: integer("modifiedBy").notNull(), // Foreign key to users
  changeDescription: text("changeDescription"),
});

export type AuditModificationHistory = typeof auditModificationHistory.$inferSelect;
export type InsertAuditModificationHistory = typeof auditModificationHistory.$inferInsert;

/**
 * Audit Signatures - Digital signatures for compliance decisions
 * Cryptographic signatures for legal defensibility and non-repudiation
 */
export const auditSignatures = pgTable("auditSignatures", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  auditId: varchar("auditId", { length: 50 }).notNull(),
  signedBy: integer("signedBy").notNull(), // Foreign key to users
  signatureImage: text("signatureImage"), // Base64
  signatureDate: timestamp("signatureDate").defaultNow(),
  signatureType: varchar("signatureType", { length: 20 }), // ENGINEER, ARCHITECT, AHJ
  signatureValid: boolean("signatureValid").default(true),
});

export type AuditSignature = typeof auditSignatures.$inferSelect;
export type InsertAuditSignature = typeof auditSignatures.$inferInsert;


/**
 * ============================================================================
 * WEEK 2: RULE DATABASE FOUNDATION (SaaS UPGRADE)
 * For managing building code rules with versioning and updates
 * ============================================================================
 */

/**
 * Rules Database - Centralized repository of building code rules
 * Enables rule versioning, updates without code changes, and rule management
 */
export const rulesDatabase = pgTable("rulesDatabase", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  
  // Rule identification
  ruleCode: varchar("ruleCode", { length: 50 }).notNull().unique(), // e.g., "OCC-B1-001"
  
  // Code version and jurisdiction
  codeVersion: varchar("codeVersion", { length: 20 }).notNull(), // e.g., "NBC_2025"
  jurisdiction: varchar("jurisdiction", { length: 50 }).default("Canada").notNull(),
  
  // Rule metadata
  title: varchar("title", { length: 255 }).notNull(), // Rule title
  description: text("description"), // Detailed description
  category: varchar("category", { length: 100 }), // e.g., "OCCUPANCY", "EGRESS", "FIRE_SAFETY"
  
  // NBC reference
  nbcReference: varchar("nbcReference", { length: 255 }), // e.g., "NBC 3.2.1"
  
  // Rule definition (JSON)
  ruleData: json("ruleData").notNull(), // Contains conditions, triggers, exceptions
  
  // Rule status
  isActive: boolean("isActive").default(true).notNull(),
  effectiveDate: timestamp("effectiveDate").notNull(),
  deprecatedDate: timestamp("deprecatedDate"), // When rule was deprecated
  
  // Audit trail
  createdBy: integer("createdBy").notNull(), // Foreign key to users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedBy: integer("updatedBy"), // Foreign key to users
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  
  // Versioning
  version: integer("version").default(1).notNull(), // Rule version number
  previousVersionId: integer("previousVersionId"), // Link to previous version
});

export type RuleDatabase = typeof rulesDatabase.$inferSelect;
export type InsertRuleDatabase = typeof rulesDatabase.$inferInsert;


/**
 * Reports table for storing generated compliance and calculation reports
 */
export const reports = pgTable("reports", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  projectId: integer("projectId"), // Optional: link to project
  name: varchar("name", { length: 255 }).notNull(),
  type: pgEnum("type", ["compliance", "calculation", "pathway", "batch"]).notNull(),
  content: json("content").notNull(), // Stores report data as JSON
  metadata: json("metadata"), // Additional metadata (filters, parameters, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Scenarios table for storing what-if scenario configurations
 */
export const scenarios = pgTable("scenarios", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  projectId: integer("projectId"), // Optional: link to project
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: pgEnum("type", ["fire_resistance", "compliance", "custom"]).notNull(),
  inputData: json("inputData").notNull(), // Stores scenario parameters
  resultData: json("resultData"), // Stores calculation results
  status: pgEnum("status", ["draft", "calculated", "archived"]).notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

/**
 * Scenario history table for tracking version changes
 */
export const scenarioHistory = pgTable("scenarioHistory", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  scenarioId: integer("scenarioId").notNull(),
  userId: integer("userId").notNull(),
  version: integer("version").notNull(),
  changes: json("changes"), // Stores what changed
  previousData: json("previousData"), // Stores previous version data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioHistory = typeof scenarioHistory.$inferSelect;
export type InsertScenarioHistory = typeof scenarioHistory.$inferInsert;

/**
 * Batch comparisons table for storing multi-scenario comparisons
 */
export const batchComparisons = pgTable("batchComparisons", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  projectId: integer("projectId"), // Optional: link to project
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scenarioIds: json("scenarioIds").notNull(), // Array of scenario IDs being compared
  comparisonData: json("comparisonData"), // Stores comparison results
  analysisType: varchar("analysisType", { length: 100 }), // Type of analysis (e.g., "fire_resistance", "compliance")
  status: pgEnum("status", ["pending", "completed", "failed"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BatchComparison = typeof batchComparisons.$inferSelect;
export type InsertBatchComparison = typeof batchComparisons.$inferInsert;


/**
 * Project Shares - Tracks user-to-user project sharing
 * Immutable record: once created, can only be soft-deleted via revokedAt
 */
export const projectShares = pgTable(
  "projectShares",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    projectId: integer("projectId").notNull(), // Project being shared
    sharedByUserId: integer("sharedByUserId").notNull(), // User who initiated the share
    sharedWithUserId: integer("sharedWithUserId").notNull(), // User receiving access
    createdAt: timestamp("createdAt").defaultNow().notNull(), // When share was granted
    revokedAt: timestamp("revokedAt"), // When share was revoked (NULL = active)
  },
  (table) => ({
    // Prevent duplicate active shares of same project with same user
    uniqueActiveShare: unique("unique_active_share").on(table.projectId, table.sharedWithUserId),
  })
);

export type ProjectShare = typeof projectShares.$inferSelect;
export type InsertProjectShare = typeof projectShares.$inferInsert;

/**
 * Collaboration Audit Log - Immutable audit trail of all collaboration actions
 * Records: SHARED, UNSHARED, VIEWED, MODIFIED
 * Never updated, only inserted
 */
export const collaborationAuditLog = pgTable("collaborationAuditLog", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(), // Project involved in action
  action: pgEnum("action", ["SHARED", "UNSHARED", "VIEWED", "MODIFIED"]).notNull(), // Type of collaboration action
  sharedByUserId: integer("sharedByUserId"), // User who performed the action
  sharedWithUserId: integer("sharedWithUserId"), // User affected by the action
  details: json("details"), // Additional context (e.g., {reason: "...", ipAddress: "..."})
  createdAt: timestamp("createdAt").defaultNow().notNull(), // Immutable timestamp
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client info for audit trail
});

export type CollaborationAuditLog = typeof collaborationAuditLog.$inferSelect;
export type InsertCollaborationAuditLog = typeof collaborationAuditLog.$inferInsert;


/**
 * ============================================================================
 * RULES MANAGEMENT SYSTEM
 * For jurisdiction-specific building code rules with search and application
 * ============================================================================
 */

/**
 * Rules Library - Pre-built rules for different jurisdictions
 * Searchable by keyword, jurisdiction, category
 * Supports NBC and provincial/municipal variations
 */
export const rulesLibrary = pgTable("rulesLibrary", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  
  // Rule identification
  ruleCode: varchar("ruleCode", { length: 100 }).notNull().unique(), // e.g., "NBC-2023-OCC-001"
  
  // Rule content
  name: varchar("name", { length: 255 }).notNull(), // Short title
  description: text("description").notNull(), // Full description
  category: varchar("category", { length: 100 }).notNull(), // e.g., "occupancy", "egress", "fire", "structural"
  
  // Jurisdiction and code reference
  jurisdiction: varchar("jurisdiction", { length: 100 }).notNull(), // "NBC", "Alberta", "BC", "Ontario", "Calgary", "Edmonton", "Toronto", "Lethbridge", "Airdrie"
  municipality: varchar("municipality", { length: 100 }), // Optional: specific municipality
  codeEdition: varchar("codeEdition", { length: 50 }).notNull(), // e.g., "NBC-2023", "AE-2023"
  nbcReference: varchar("nbcReference", { length: 255 }), // e.g., "NBC 3.2.2.47"
  
  // Keywords for search
  keywords: text("keywords"), // Comma-separated: "loads,span,fire,egress,area,adjacency,height"
  
  // Rule metadata
  applicableOccupancies: text("applicableOccupancies"), // JSON array of occupancy codes
  applicableConstructionTypes: text("applicableConstructionTypes"), // JSON array
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isCustom: boolean("isCustom").default(false).notNull(), // true if user-created
  
  // Audit trail
  createdBy: integer("createdBy").notNull(), // User ID who created/imported
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedBy: integer("updatedBy"), // User ID who last updated
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RuleLibrary = typeof rulesLibrary.$inferSelect;
export type InsertRuleLibrary = typeof rulesLibrary.$inferInsert;

/**
 * Rule Applications - Link rules to projects
 * Tracks which rules are applied to which projects
 * Can be project-specific or organization-wide (global)
 */
export const ruleApplications = pgTable(
  "ruleApplications",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    
    // Rule being applied
    ruleId: integer("ruleId").notNull(), // FK to rulesLibrary
    
    // Applied to project or globally
    projectId: integer("projectId"), // NULL = organization-wide (global)
    userId: integer("userId").notNull(), // User who applied the rule
    
    // Application metadata
    appliedAt: timestamp("appliedAt").defaultNow().notNull(),
    status: pgEnum("status", ["active", "inactive", "archived"]).notNull(),
    
    // Compliance tracking
    isCompliant: integer("isCompliant"), // 0 = no, 1 = yes, NULL = not yet assessed
    complianceNotes: text("complianceNotes"), // Why compliant/non-compliant
    
    // Audit trail
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    // Prevent duplicate active applications of same rule to same project
    uniqueProjectRule: unique("unique_project_rule").on(table.ruleId, table.projectId),
  })
);

export type RuleApplication = typeof ruleApplications.$inferSelect;
export type InsertRuleApplication = typeof ruleApplications.$inferInsert;

/**
 * Custom Rules - User-created rules with full audit trail
 * For organization-specific or project-specific compliance requirements
 * Includes creator credentials and authorization tracking
 */
export const customRules = pgTable("customRules", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  
  // Rule identification
  ruleCode: varchar("ruleCode", { length: 100 }).notNull().unique(), // e.g., "CUSTOM-2024-001"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Rule content
  category: varchar("category", { length: 100 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 100 }), // Optional: specific jurisdiction
  keywords: text("keywords"), // Comma-separated for search
  
  // Creator information (audit trail)
  creatorId: integer("creatorId").notNull(), // User who created
  creatorName: varchar("creatorName", { length: 255 }).notNull(),
  creatorCredentials: text("creatorCredentials"), // JSON: profession, license, credentials
  
  // Authorization tracking
  authorizedBy: integer("authorizedBy"), // Admin/manager who approved
  authorizedAt: timestamp("authorizedAt"), // When authorized
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  // Audit trail
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CustomRule = typeof customRules.$inferSelect;
export type InsertCustomRule = typeof customRules.$inferInsert;

/**
 * Rule Audit Trail - Immutable audit log for all rule operations
 * Tracks: creation, application, modification, deletion
 * Never updated, only inserted
 */
export const ruleAuditTrail = pgTable("ruleAuditTrail", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  
  // What happened
  action: pgEnum("action", ["CREATED", "APPLIED", "MODIFIED", "DEACTIVATED", "DELETED"]).notNull(),
  
  // Which rule
  ruleId: integer("ruleId"), // FK to rulesLibrary or customRules
  ruleCode: varchar("ruleCode", { length: 100 }).notNull(),
  ruleType: pgEnum("ruleType", ["library", "custom"]).notNull(),
  
  // Which project (if applicable)
  projectId: integer("projectId"), // NULL if organization-wide
  
  // Who did it
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userCredentials: text("userCredentials"), // JSON snapshot of credentials at time of action
  
  // Details
  details: json("details"), // Additional context
  
  // Security metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Immutable timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RuleAuditTrail = typeof ruleAuditTrail.$inferSelect;
export type InsertRuleAuditTrail = typeof ruleAuditTrail.$inferInsert;


/**
 * Drawing Analysis - Main analysis records
 * Tracks drawing uploads, analysis status, compliance scores, and professional validation
 */
export const drawingAnalyses = pgTable("drawingAnalyses", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  
  // Drawing file references
  drawingUrl: text("drawingUrl").notNull(),
  drawingHash: varchar("drawingHash", { length: 64 }).notNull(), // SHA-256 hash
  drawingSnapshotKey: varchar("drawingSnapshotKey", { length: 500 }), // S3 key for immutable snapshot
  drawingSnapshotMimeType: varchar("drawingSnapshotMimeType", { length: 50 }), // MIME type
  drawingSnapshotSize: integer("drawingSnapshotSize"), // File size in bytes
  
  // Analysis metadata
  analysisType: pgEnum("analysisType", ["structural", "fire-safety", "connections", "comprehensive"]),
  analysisStatus: pgEnum("analysisStatus", ["DRAFT", "UNDER_REVIEW", "VALID", "REJECTED"])
    .notNull()
    .default("DRAFT"),
  
  // Compliance results
  complianceScore: integer("complianceScore"), // 0-100
  complianceLevel: pgEnum("complianceLevel", ["approved", "conditional", "revision", "rejected"]),
  
  // Detailed analysis results (JSON)
  structuralStatus: text("structuralStatus"), // JSON
  fireSafetyStatus: text("fireSafetyStatus"), // JSON
  connectionStatus: text("connectionStatus"), // JSON
  issues: text("issues"), // JSON array of issues
  recommendations: text("recommendations"), // JSON array of recommendations
  
  // Disclaimer tracking
  disclaimerAcknowledged: boolean("disclaimerAcknowledged").notNull().default(false),
  disclaimerAcknowledgedAt: timestamp("disclaimerAcknowledgedAt"),
  disclaimerVersion: varchar("disclaimerVersion", { length: 20 }).notNull(),
  
  // Versioning
  llmModelVersion: varchar("llmModelVersion", { length: 50 }), // e.g., "claude-vision-4"
  ruleEngineVersion: varchar("ruleEngineVersion", { length: 20 }), // e.g., "1.0"
  
  // Professional validation
  validatedAt: timestamp("validatedAt"),
  validatedByUserId: integer("validatedByUserId"),
  validatedByLicenseNumber: varchar("validatedByLicenseNumber", { length: 100 }),
  validatedByAssociation: varchar("validatedByAssociation", { length: 100 }), // e.g., "APEGA", "AIBC"
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DrawingAnalysis = typeof drawingAnalyses.$inferSelect;
export type InsertDrawingAnalysis = typeof drawingAnalyses.$inferInsert;

/**
 * Drawing Data Extractions - LLM extraction results
 * Stores structured drawing data extracted by Claude Vision
 */
export const drawingDataExtractions = pgTable("drawingDataExtractions", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  analysisId: integer("analysisId").notNull(),
  
  // Extracted data (JSON)
  extractedData: text("extractedData").notNull(), // JSON - structured DrawingData
  
  // Extraction metadata
  extractionModel: varchar("extractionModel", { length: 50 }).notNull(), // e.g., "claude-vision-4"
  extractionPromptVersion: varchar("extractionPromptVersion", { length: 20 }).notNull(),
  extractionConfidence: decimal("extractionConfidence", { precision: 3, scale: 2 }), // 0.0-1.0
  
  // Timestamps
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
});

export type DrawingDataExtraction = typeof drawingDataExtractions.$inferSelect;
export type InsertDrawingDataExtraction = typeof drawingDataExtractions.$inferInsert;

/**
 * NBC Rules - Versioned compliance rules
 * Stores NBC 2020 rules for deterministic compliance evaluation
 */
export const nbcRules = pgTable("nbcRules", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  
  // Rule identification
  ruleId: varchar("ruleId", { length: 50 }).notNull().unique(), // e.g., "NBC-3.1.5.1"
  section: varchar("section", { length: 20 }).notNull(), // e.g., "3.1.5.1"
  clause: varchar("clause", { length: 100 }).notNull(),
  description: text("description").notNull(),
  
  // Categorization
  category: pgEnum("category", ["structural", "fire-safety", "connections", "materials", "csa"])
    .notNull(),
  jurisdiction: varchar("jurisdiction", { length: 50 }), // e.g., "national", "AB", "BC", "ON"
  
  // Versioning
  ruleVersion: integer("ruleVersion").notNull().default(1),
  isActive: boolean("isActive").notNull().default(true),
  
  // Evaluation metadata
  requiredFields: text("requiredFields"), // JSON array of required DrawingData fields
  evaluationLogic: varchar("evaluationLogic", { length: 500 }), // Description of evaluation logic
  
  // Audit trail
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdByUserId: integer("createdByUserId"),
});

export type NBCRule = typeof nbcRules.$inferSelect;
export type InsertNBCRule = typeof nbcRules.$inferInsert;

/**
 * Compliance Evaluation Results - Rule evaluation results
 * Stores results of evaluating each rule against drawing data
 */
export const complianceEvaluationResults = pgTable("complianceEvaluationResults", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  analysisId: integer("analysisId").notNull(),
  ruleId: integer("ruleId").notNull(),
  ruleVersion: integer("ruleVersion").notNull(),
  
  // Evaluation result
  evaluationResult: pgEnum("evaluationResult", ["PASS", "FAIL", "CONDITIONAL", "UNABLE_TO_EVALUATE"])
    .notNull(),
  
  // Detailed results (JSON)
  evaluationDetails: text("evaluationDetails"), // JSON with evaluation details
  
  // Timestamp
  evaluatedAt: timestamp("evaluatedAt").defaultNow().notNull(),
});

export type ComplianceEvaluationResult = typeof complianceEvaluationResults.$inferSelect;
export type InsertComplianceEvaluationResult = typeof complianceEvaluationResults.$inferInsert;

/**
 * Compliance Audit Trail - Immutable audit log
 * Records all actions taken on analyses with full credential capture
 * CRITICAL: This table must be immutable (no UPDATE/DELETE at DB layer)
 */
export const complianceAuditTrail = pgTable("complianceAuditTrail", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  analysisId: integer("analysisId").notNull(),
  userId: integer("userId").notNull(),
  
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "DRAWING_UPLOADED", "EXTRACTION_COMPLETED"
  details: text("details").notNull(), // JSON with action-specific details
  
  // User credentials
  userEmail: varchar("userEmail", { length: 255 }).notNull(),
  userFullName: varchar("userFullName", { length: 255 }),
  
  // Professional credentials (for professional review events)
  professionalLicenseNumber: varchar("professionalLicenseNumber", { length: 100 }),
  professionalAssociation: varchar("professionalAssociation", { length: 100 }), // e.g., "APEGA"
  jurisdiction: varchar("jurisdiction", { length: 100 }), // Province/territory
  
  // Request context (forensic traceability)
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/device fingerprint
  sessionId: varchar("sessionId", { length: 255 }), // Session identifier
  
  // Server-side timestamp (NEVER client-side)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // Immutability flag - prevents modification of audit records
  isImmutable: boolean("is_immutable").notNull().default(true),
});

export type ComplianceAuditTrail = typeof complianceAuditTrail.$inferSelect;
export type InsertComplianceAuditTrail = typeof complianceAuditTrail.$inferInsert;

/**
 * Disclaimer Acknowledgments - Disclaimer tracking
 * Records all disclaimer acknowledgments for legal proof of informed consent
 */
export const disclaimerAcknowledgments = pgTable("disclaimerAcknowledgments", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  
  // Disclaimer details
  disclaimerVersion: varchar("disclaimerVersion", { length: 20 }).notNull(),
  disclaimerText: text("disclaimerText").notNull(), // Full text of disclaimer
  
  // Request context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Server-side timestamp
  acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(),
  
  // Immutability flag - prevents modification of disclaimer records
  isImmutable: boolean("is_immutable").notNull().default(true),
});

export type DisclaimerAcknowledgment = typeof disclaimerAcknowledgments.$inferSelect;
export type InsertDisclaimerAcknowledgment = typeof disclaimerAcknowledgments.$inferInsert;

/**
 * Indexes for query performance
 */
// Drawing Analyses indexes
export const drawingAnalysesIndexes = {
  analysisStatus: true, // Query by status
  disclaimerAcknowledged: true, // Query by disclaimer status
  validatedAt: true, // Query by validation date
  drawingHash: true, // Query by hash (integrity verification)
  projectId: true, // Query by project
  userId: true, // Query by user
};

// Compliance Audit Trail indexes
export const complianceAuditTrailIndexes = {
  userEmail: true, // Query by email
  professionalLicenseNumber: true, // Query by professional
  jurisdiction: true, // Query by jurisdiction
  sessionId: true, // Query by session
  action: true, // Query by action type
  analysisId: true, // Query by analysis
};
