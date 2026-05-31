import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, date, time } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

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
  /** OAuth identifier (openId) returned from the OAuth callback (Google ID). Unique per user. */
  openId: varchar("openId", { length: 255 }).notNull().unique(),
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

// ============ HIERARCHICAL ENTITIES ============

export const campos = mysqlTable("campos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campo = typeof campos.$inferSelect;
export type InsertCampo = typeof campos.$inferInsert;

export const misiones = mysqlTable("misiones", {
  id: int("id").autoincrement().primaryKey(),
  campoId: int("campoId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Mision = typeof misiones.$inferSelect;
export type InsertMision = typeof misiones.$inferInsert;

export const objetivos = mysqlTable("objetivos", {
  id: int("id").autoincrement().primaryKey(),
  misionId: int("misionId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Objetivo = typeof objetivos.$inferSelect;
export type InsertObjetivo = typeof objetivos.$inferInsert;

export const metas = mysqlTable("metas", {
  id: int("id").autoincrement().primaryKey(),
  objetivoId: int("objetivoId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  weightAI: decimal("weightAI", { precision: 3, scale: 2 }).default("0.40").notNull(),
  weightTrackables: decimal("weightTrackables", { precision: 3, scale: 2 }).default("0.60").notNull(),
  conclusion: text("conclusion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meta = typeof metas.$inferSelect;
export type InsertMeta = typeof metas.$inferInsert;

// ============ TRACKING ENTITIES ============

export const trackeables = mysqlTable("trackeables", {
  id: int("id").autoincrement().primaryKey(),
  metaId: int("metaId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["binary", "numeric"]).notNull(),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trackeable = typeof trackeables.$inferSelect;
export type InsertTrackeable = typeof trackeables.$inferInsert;

export const trackableValues = mysqlTable("trackableValues", {
  id: int("id").autoincrement().primaryKey(),
  trackableId: int("trackableId").notNull(),
  date: date("date").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: int("durationMinutes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrackableValue = typeof trackableValues.$inferSelect;
export type InsertTrackableValue = typeof trackableValues.$inferInsert;

export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  metaId: int("metaId").notNull(),
  date: date("date").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

export const aiPoints = mysqlTable("aiPoints", {
  id: int("id").autoincrement().primaryKey(),
  metaId: int("metaId").notNull(),
  date: date("date").notNull(),
  score: int("score").notNull(),
  rationale: text("rationale"),
  recommendations: text("recommendations"),
  inputSnapshot: json("inputSnapshot"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIPoint = typeof aiPoints.$inferSelect;
export type InsertAIPoint = typeof aiPoints.$inferInsert;

export const weeklyConclusions = mysqlTable("weeklyConclusions", {
  id: int("id").autoincrement().primaryKey(),
  metaId: int("metaId").notNull(),
  weekStart: date("weekStart").notNull(),
  weekEnd: date("weekEnd").notNull(),
  conclusion: text("conclusion").notNull(),
  summary: text("summary"),
  patterns: text("patterns"),
  recommendations: text("recommendations"),
  evidenceSnapshot: json("evidenceSnapshot"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyConclusion = typeof weeklyConclusions.$inferSelect;
export type InsertWeeklyConclusion = typeof weeklyConclusions.$inferInsert;

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  campos: many(campos),
}));

export const camposRelations = relations(campos, ({ one, many }) => ({
  user: one(users, { fields: [campos.userId], references: [users.id] }),
  misiones: many(misiones),
}));

export const misionesRelations = relations(misiones, ({ one, many }) => ({
  campo: one(campos, { fields: [misiones.campoId], references: [campos.id] }),
  objetivos: many(objetivos),
}));

export const objetivosRelations = relations(objetivos, ({ one, many }) => ({
  mision: one(misiones, { fields: [objetivos.misionId], references: [misiones.id] }),
  metas: many(metas),
}));

export const metasRelations = relations(metas, ({ one, many }) => ({
  objetivo: one(objetivos, { fields: [metas.objetivoId], references: [objetivos.id] }),
  trackeables: many(trackeables),
  notes: many(notes),
  aiPoints: many(aiPoints),
  weeklyConclusions: many(weeklyConclusions),
}));

export const trackeablesRelations = relations(trackeables, ({ one, many }) => ({
  meta: one(metas, { fields: [trackeables.metaId], references: [metas.id] }),
  values: many(trackableValues),
}));

export const trackableValuesRelations = relations(trackableValues, ({ one }) => ({
  trackable: one(trackeables, { fields: [trackableValues.trackableId], references: [trackeables.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  meta: one(metas, { fields: [notes.metaId], references: [metas.id] }),
}));

export const aiPointsRelations = relations(aiPoints, ({ one }) => ({
  meta: one(metas, { fields: [aiPoints.metaId], references: [metas.id] }),
}));

export const weeklyConclusions_Relations = relations(weeklyConclusions, ({ one }) => ({
  meta: one(metas, { fields: [weeklyConclusions.metaId], references: [metas.id] }),
}));
