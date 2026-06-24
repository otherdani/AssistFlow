import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  language: text("language", { enum: ["en", "hu"] }).notNull().default("en"),
  status: text("status", { enum: ["preparing", "ready", "in_progress", "completed"] }).notNull().default("preparing"),
  securityCode: text("security_code"),
  step1Completed: boolean("step1_completed").notNull().default(false),
  step2Completed: boolean("step2_completed").notNull().default(false),
  step3Completed: boolean("step3_completed").notNull().default(false),
  step4Completed: boolean("step4_completed").notNull().default(false),
  step5Completed: boolean("step5_completed").notNull().default(false),
  step6Completed: boolean("step6_completed").notNull().default(false),
  step7Completed: boolean("step7_completed").notNull().default(false),
  step8Completed: boolean("step8_completed").notNull().default(false),
  computerInfo: text("computer_info"),
  issueDescription: text("issue_description"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  customerName: true,
  customerEmail: true,
  language: true,
  computerInfo: true,
  issueDescription: true,
}).partial({
  customerEmail: true,
  language: true,
  computerInfo: true,
  issueDescription: true,
});

export const updateSessionSchema = createInsertSchema(sessions).pick({
  securityCode: true,
  status: true,
  step1Completed: true,
  step2Completed: true,
  step3Completed: true,
  step4Completed: true,
  step5Completed: true,
  step6Completed: true,
  step7Completed: true,
  step8Completed: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
export type Session = typeof sessions.$inferSelect;
