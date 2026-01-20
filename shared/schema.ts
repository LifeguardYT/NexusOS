import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// OS Settings schema
export const settingsSchema = z.object({
  wallpaper: z.string().default("gradient-1"),
  theme: z.enum(["light", "dark"]).default("dark"),
  accentColor: z.string().default("blue"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium"),
  showDesktopIcons: z.boolean().default(true),
  taskbarPosition: z.enum(["bottom", "top"]).default("bottom"),
  volume: z.number().min(0).max(100).default(50),
  brightness: z.number().min(0).max(100).default(100),
  notifications: z.boolean().default(true),
  wifi: z.boolean().default(true),
  bluetooth: z.boolean().default(false),
  developerMode: z.boolean().default(false),
  syncEnabled: z.boolean().default(false),
  displayName: z.string().default(""),
});

export type Settings = z.infer<typeof settingsSchema>;

// Window state
export const windowStateSchema = z.object({
  id: z.string(),
  appId: z.string(),
  title: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  isMaximized: z.boolean().default(false),
  isMinimized: z.boolean().default(false),
  zIndex: z.number(),
});

export type WindowState = z.infer<typeof windowStateSchema>;

// App definition
export const appSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  defaultWidth: z.number(),
  defaultHeight: z.number(),
});

export type App = z.infer<typeof appSchema>;

// File system
export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["file", "folder"]),
  content: z.string().optional(),
  parentId: z.string().nullable(),
  icon: z.string().optional(),
});

export type FileItem = z.infer<typeof fileSchema>;

// Note
export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Note = z.infer<typeof noteSchema>;

// System Updates table
export const updates = pgTable("updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertUpdateSchema = createInsertSchema(updates).omit({ id: true, createdAt: true });
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type Update = typeof updates.$inferSelect;

// Chat Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  recipientId: text("recipient_id"), // null for global chat
  content: text("content").notNull(),
  isGlobal: boolean("is_global").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Custom Apps table (admin-added apps in App Store)
export const customApps = pgTable("custom_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  logoBase64: text("logo_base64").notNull(),
  category: text("category").notNull().default("Other"),
  externalUrl: text("external_url"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertCustomAppSchema = createInsertSchema(customApps).omit({ id: true, createdAt: true });
export type InsertCustomApp = z.infer<typeof insertCustomAppSchema>;
export type CustomApp = typeof customApps.$inferSelect;
