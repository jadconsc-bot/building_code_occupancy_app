import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
