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
