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
  customAppUrl: z.string().optional(),
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
  iconImage: z.string().optional(),
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

// Global Notifications table (owner can broadcast to all users)
export const globalNotifications = pgTable("global_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertGlobalNotificationSchema = createInsertSchema(globalNotifications).omit({ id: true, createdAt: true });
export type InsertGlobalNotification = z.infer<typeof insertGlobalNotificationSchema>;
export type GlobalNotification = typeof globalNotifications.$inferSelect;

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

// Bug Reports table
export const bugReports = pgTable("bug_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertBugReportSchema = createInsertSchema(bugReports).omit({ id: true, createdAt: true, resolved: true });
export type InsertBugReport = z.infer<typeof insertBugReportSchema>;
export type BugReport = typeof bugReports.$inferSelect;

// User Presence table
export const userPresence = pgTable("user_presence", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull(),
  status: text("status").notNull().default("online"),
  lastSeen: text("last_seen").notNull().default(sql`now()`),
  activity: text("activity"),
});

export const insertUserPresenceSchema = createInsertSchema(userPresence);
export type InsertUserPresence = z.infer<typeof insertUserPresenceSchema>;
export type UserPresence = typeof userPresence.$inferSelect;

// Friends table
export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  friendId: text("friend_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertFriendSchema = createInsertSchema(friends).omit({ id: true, createdAt: true });
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

// Emails table
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: text("from_user_id").notNull(),
  fromName: text("from_name").notNull(),
  fromEmail: text("from_email").notNull(),
  toUserId: text("to_user_id").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  isStarred: boolean("is_starred").notNull().default(false),
  folder: text("folder").notNull().default("inbox"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertEmailSchema = createInsertSchema(emails).omit({ id: true, createdAt: true });
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

// User Tags table (owner-assigned custom tags for users)
export const userTags = pgTable("user_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"), // hex color
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertUserTagSchema = createInsertSchema(userTags).omit({ id: true, createdAt: true });
export type InsertUserTag = z.infer<typeof insertUserTagSchema>;
export type UserTag = typeof userTags.$inferSelect;
