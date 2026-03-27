/**
 * Enterprise Schema Extensions
 * 
 * Adds multi-tenant, team collaboration, and monetization tables
 * These enable CodeComply to scale from solo users to enterprise firms
 */

import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  boolean,
  decimal,
  json,
  enum as mysqlEnum,
  primaryKey,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './schema';

// ============================================================================
// CLIENTS TABLE - For consultants to manage their clients
// ============================================================================

export const clients = pgTable(
  'clients',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    consultantId: varchar('consultant_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    province: varchar('province', { length: 100 }),
    postalCode: varchar('postal_code', { length: 10 }),
    companyName: varchar('company_name', { length: 255 }),
    industry: varchar('industry', { length: 100 }),
    notes: text('notes'),
    status: pgEnum('status', ['active', 'inactive', 'archived']).default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    consultantIdIdx: index('consultant_id_idx').on(table.consultantId),
    emailIdx: index('email_idx').on(table.email),
  })
);

// ============================================================================
// TEAMS TABLE - For firm management and collaboration
// ============================================================================

export const teams = pgTable(
  'teams',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    ownerId: varchar('owner_id', { length: 36 }).notNull(),
    description: text('description'),
    logo: varchar('logo', { length: 500 }),
    website: varchar('website', { length: 255 }),
    status: pgEnum('status', ['active', 'inactive', 'suspended']).default('active'),
    memberCount: int('member_count').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    ownerIdIdx: index('owner_id_idx').on(table.ownerId),
  })
);

// ============================================================================
// TEAM MEMBERS TABLE - For team collaboration
// ============================================================================

export const teamMembers = pgTable(
  'team_members',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    teamId: varchar('team_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    role: pgEnum('role', ['owner', 'admin', 'member', 'viewer']).default('member'),
    permissions: json('permissions').default({}),
    joinedAt: timestamp('joined_at').defaultNow(),
    status: pgEnum('status', ['active', 'inactive', 'invited']).default('active'),
  },
  (table) => ({
    teamIdIdx: index('team_id_idx').on(table.teamId),
    userIdIdx: index('user_id_idx').on(table.userId),
  })
);

// ============================================================================
// PROJECT MEMBERS TABLE - For project collaboration
// ============================================================================

export const projectMembers = pgTable(
  'project_members',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    projectId: varchar('project_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    role: pgEnum('role', ['owner', 'editor', 'viewer', 'client']).default('viewer'),
    permissions: json('permissions').default({}),
    addedAt: timestamp('added_at').defaultNow(),
    status: pgEnum('status', ['active', 'inactive', 'invited']).default('active'),
  },
  (table) => ({
    projectIdIdx: index('project_id_idx').on(table.projectId),
    userIdIdx: index('user_id_idx').on(table.userId),
  })
);

// ============================================================================
// SUBSCRIPTIONS TABLE - For monetization and billing
// ============================================================================

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    teamId: varchar('team_id', { length: 36 }),
    tier: pgEnum('tier', ['free', 'professional', 'enterprise']).default('free'),
    status: pgEnum('status', ['active', 'inactive', 'cancelled', 'past_due']).default(
      'active'
    ),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).default('0.00'),
    billingCycle: pgEnum('billing_cycle', ['monthly', 'annual']).default('monthly'),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdIdx: index('user_id_idx').on(table.userId),
    teamIdIdx: index('team_id_idx').on(table.teamId),
    stripeCustomerIdIdx: index('stripe_customer_id_idx').on(table.stripeCustomerId),
  })
);

// ============================================================================
// USAGE METRICS TABLE - For tracking usage and limits
// ============================================================================

export const usageMetrics = pgTable(
  'usage_metrics',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
    month: varchar('month', { length: 7 }).notNull(), // YYYY-MM
    calculationsUsed: int('calculations_used').default(0),
    calculationsLimit: int('calculations_limit').default(100),
    projectsUsed: int('projects_used').default(0),
    projectsLimit: int('projects_limit').default(10),
    teamMembersUsed: int('team_members_used').default(0),
    teamMembersLimit: int('team_members_limit').default(5),
    storageUsedMB: int('storage_used_mb').default(0),
    storageLimitMB: int('storage_limit_mb').default(1000),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    subscriptionIdIdx: index('subscription_id_idx').on(table.subscriptionId),
    monthIdx: index('month_idx').on(table.month),
  })
);

// ============================================================================
// INVOICES TABLE - For billing history
// ============================================================================

export const invoices = pgTable(
  'invoices',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('CAD'),
    status: pgEnum('status', ['draft', 'sent', 'paid', 'failed', 'cancelled']).default(
      'draft'
    ),
    invoiceDate: timestamp('invoice_date').notNull(),
    dueDate: timestamp('due_date'),
    paidAt: timestamp('paid_at'),
    description: text('description'),
    lineItems: json('line_items').default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    subscriptionIdIdx: index('subscription_id_idx').on(table.subscriptionId),
    stripeInvoiceIdIdx: index('stripe_invoice_id_idx').on(table.stripeInvoiceId),
  })
);

// ============================================================================
// GLOBAL AUDIT LOGS TABLE - For compliance and security
// ============================================================================

export const globalAuditLogs = pgTable(
  'global_audit_logs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }),
    resourceId: varchar('resource_id', { length: 36 }),
    details: json('details').default({}),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    status: pgEnum('status', ['success', 'failure']).default('success'),
    timestamp: timestamp('timestamp').defaultNow(),
    hash: varchar('hash', { length: 64 }), // SHA-256 for integrity
    previousHash: varchar('previous_hash', { length: 64 }), // Chain link
  },
  (table) => ({
    userIdIdx: index('user_id_idx').on(table.userId),
    actionIdx: index('action_idx').on(table.action),
    resourceTypeIdx: index('resource_type_idx').on(table.resourceType),
    timestampIdx: index('timestamp_idx').on(table.timestamp),
  })
);

// ============================================================================
// STRIPE CUSTOMERS TABLE - For payment integration
// ============================================================================

export const stripeCustomers = pgTable(
  'stripe_customers',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    metadata: json('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdIdx: index('user_id_idx').on(table.userId),
    stripeCustomerIdIdx: index('stripe_customer_id_idx').on(table.stripeCustomerId),
  })
);

// ============================================================================
// COMPLIANCE CERTIFICATES TABLE - For legal defensibility
// ============================================================================

export const complianceCertificates = pgTable(
  'compliance_certificates',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    calculationId: varchar('calculation_id', { length: 36 }).notNull(),
    certificateNumber: varchar('certificate_number', { length: 100 }).notNull().unique(),
    issuedBy: varchar('issued_by', { length: 255 }).notNull(),
    issuedDate: timestamp('issued_date').notNull(),
    expiresDate: timestamp('expires_date'),
    status: pgEnum('status', ['valid', 'expired', 'revoked']).default('valid'),
    publicKeyFingerprint: varchar('public_key_fingerprint', { length: 64 }),
    signatureAlgorithm: varchar('signature_algorithm', { length: 50 }),
    metadata: json('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    calculationIdIdx: index('calculation_id_idx').on(table.calculationId),
    certificateNumberIdx: index('certificate_number_idx').on(table.certificateNumber),
  })
);

// ============================================================================
// EXPORTS
// ============================================================================

export type Client = typeof clients.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UsageMetrics = typeof usageMetrics.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type GlobalAuditLog = typeof globalAuditLogs.$inferSelect;
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type ComplianceCertificate = typeof complianceCertificates.$inferSelect;
