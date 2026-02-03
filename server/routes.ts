import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { settingsSchema, insertUpdateSchema, insertMessageSchema, insertCustomAppSchema, insertBugReportSchema, users, messages, customApps, bugReports, userPresence, friends, emails, insertEmailSchema, globalNotifications, insertGlobalNotificationSchema, userTags, insertUserTagSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { updates } from "@shared/schema";
import { desc, eq, or, and, ilike, sql } from "drizzle-orm";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import os from "os";
import archiver from "archiver";
import path from "path";
import fs from "fs";

// Global shutdown state
let shutdownState = {
  isShutdown: false,
  isShuttingDown: false,
  shutdownTime: null as number | null,
  message: "",
  reason: null as string | null,
};

// WebSocket clients for real-time updates
const wsClients = new Set<WebSocket>();

// Meeting rooms for video call chat
interface MeetingClient {
  ws: WebSocket;
  meetingId: string;
  userName: string;
  oderId: string;
}
const meetingClients = new Map<WebSocket, MeetingClient>();

function broadcastToMeeting(meetingId: string, message: object, excludeWs?: WebSocket) {
  const messageStr = JSON.stringify(message);
  meetingClients.forEach((client, ws) => {
    if (client.meetingId === meetingId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
      } catch (err) {
        console.error("Error sending to meeting client:", err);
      }
    }
  });
}

function getMeetingParticipants(meetingId: string): string[] {
  const participants: string[] = [];
  meetingClients.forEach((client) => {
    if (client.meetingId === meetingId) {
      participants.push(client.userName);
    }
  });
  return participants;
}

function broadcastShutdownStatus() {
  const message = JSON.stringify({
    type: "shutdown_status",
    ...shutdownState,
  });
  wsClients.forEach((client) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      } else {
        // Remove disconnected clients
        wsClients.delete(client);
      }
    } catch (err) {
      console.error("Error sending to WebSocket client:", err);
      wsClients.delete(client);
    }
  });
}

// Owner user ID - the original owner who can grant admin to others
const OWNER_USER_ID = process.env.ADMIN_USER_ID || "";

// Helper function to check if user is admin (owner OR has isAdmin flag)
async function isUserAdmin(userId: string): Promise<boolean> {
  if (userId === OWNER_USER_ID) return true;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user?.isAdmin === true;
}

// Helper function to check if user is the owner
function isOwner(userId: string): boolean {
  return userId === OWNER_USER_ID;
}

// Helper function to get client IP address
function getClientIp(req: any): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const DEFAULT_USER_ID = "default-user";

  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Middleware to catch banned users on login and record their IP
  // This runs after auth so we can check if the authenticated user is banned
  app.use(async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (userId) {
        // Check if this user is banned
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user?.banned) {
          // Log them out and block access
          req.logout(() => {});
          return res.status(403).json({ 
            error: "Account banned", 
            reason: user.banReason || "Your account has been banned",
            banned: true
          });
        }
      }
    } catch (error) {
      console.error("Error checking banned status on login:", error);
    }
    next();
  });

  // Middleware to track user IP on authenticated requests
  app.use(async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (userId) {
        const clientIp = getClientIp(req);
        // Update user's last known IP (don't await to avoid slowing down requests)
        db.update(users)
          .set({ lastIp: clientIp })
          .where(eq(users.id, userId))
          .execute()
          .catch(err => console.error("Failed to update user IP:", err));
      }
    } catch (error) {
      // Don't block the request if IP tracking fails
    }
    next();
  });

  // Get admin status for current user
  app.get("/api/admin/status", async (req: any, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ isAdmin: false, isOwner: false, userId: null, ownerId: null });
      }
      const adminStatus = await isUserAdmin(userId);
      const ownerStatus = isOwner(userId);
      res.json({ isAdmin: adminStatus, isOwner: ownerStatus, userId, ownerId: OWNER_USER_ID });
    } catch (error) {
      console.error("Failed to check admin status:", error);
      res.json({ isAdmin: false, isOwner: false, userId: null, ownerId: null });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings(DEFAULT_USER_ID);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings (non-admin settings only)
  app.patch("/api/settings", async (req: any, res) => {
    try {
      const updateData = req.body;
      
      // Remove developerMode from updates - must use /api/admin/dev-mode instead
      if ('developerMode' in updateData) {
        delete updateData.developerMode;
      }
      
      const settings = await storage.updateSettings(DEFAULT_USER_ID, updateData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  });

  // Get all updates
  app.get("/api/updates", async (req, res) => {
    try {
      const allUpdates = await db.select().from(updates).orderBy(desc(updates.createdAt));
      res.json(allUpdates);
    } catch (error) {
      console.error("Failed to fetch updates:", error);
      res.status(500).json({ error: "Failed to fetch updates" });
    }
  });

  // Create a new update (admin only)
  app.post("/api/updates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const data = insertUpdateSchema.parse(req.body);
      const [newUpdate] = await db.insert(updates).values(data).returning();
      res.json(newUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid update data", details: error.errors });
      } else {
        console.error("Failed to create update:", error);
        res.status(500).json({ error: "Failed to create update" });
      }
    }
  });

  // Delete an update (admin only)
  app.delete("/api/updates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { id } = req.params;
      await db.delete(updates).where(eq(updates.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete update:", error);
      res.status(500).json({ error: "Failed to delete update" });
    }
  });

  // Get global notifications (for checking new ones)
  app.get("/api/notifications", async (req, res) => {
    try {
      const allNotifications = await db.select().from(globalNotifications).orderBy(desc(globalNotifications.createdAt));
      res.json(allNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Create a global notification (owner only)
  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !isOwner(userId)) {
        return res.status(403).json({ error: "Owner access required" });
      }
      const data = insertGlobalNotificationSchema.parse(req.body);
      const [newNotification] = await db.insert(globalNotifications).values(data).returning();
      res.json(newNotification);
    } catch (error) {
      console.error("Failed to create notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // Delete a global notification (owner only)
  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !isOwner(userId)) {
        return res.status(403).json({ error: "Owner access required" });
      }
      const { id } = req.params;
      await db.delete(globalNotifications).where(eq(globalNotifications.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Get all custom apps
  app.get("/api/custom-apps", async (req, res) => {
    try {
      const allApps = await db.select().from(customApps).orderBy(desc(customApps.createdAt));
      res.json(allApps);
    } catch (error) {
      console.error("Failed to fetch custom apps:", error);
      res.status(500).json({ error: "Failed to fetch custom apps" });
    }
  });

  // Create a new custom app (admin only)
  app.post("/api/custom-apps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const data = insertCustomAppSchema.parse(req.body);
      const [newApp] = await db.insert(customApps).values(data).returning();
      res.json(newApp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid app data", details: error.errors });
      } else {
        console.error("Failed to create custom app:", error);
        res.status(500).json({ error: "Failed to create custom app" });
      }
    }
  });

  // Delete a custom app (admin only)
  app.delete("/api/custom-apps/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { id } = req.params;
      await db.delete(customApps).where(eq(customApps.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete custom app:", error);
      res.status(500).json({ error: "Failed to delete custom app" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get system diagnostics (admin only)
  app.get("/api/admin/diagnostics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const diagnostics = {
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: os.uptime(),
          nodeVersion: process.version,
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || "Unknown",
        },
        process: {
          pid: process.pid,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
        },
      };
      
      res.json(diagnostics);
    } catch (error) {
      console.error("Failed to fetch diagnostics:", error);
      res.status(500).json({ error: "Failed to fetch diagnostics" });
    }
  });

  // Toggle developer mode (admin only)
  app.post("/api/admin/dev-mode", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { enabled } = req.body;
      // Store developer mode status in settings
      const settings = await storage.updateSettings("default-user", { developerMode: enabled });
      res.json({ success: true, developerMode: enabled });
    } catch (error) {
      console.error("Failed to toggle dev mode:", error);
      res.status(500).json({ error: "Failed to toggle developer mode" });
    }
  });

  // Ban/unban user (admin only)
  app.post("/api/admin/users/:userId/ban", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user?.claims?.sub;
      if (!adminId || !(await isUserAdmin(adminId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { banned, reason } = req.body;
      
      // Prevent banning the owner or yourself
      if (userId === OWNER_USER_ID) {
        return res.status(400).json({ error: "Cannot ban the owner" });
      }
      if (userId === adminId) {
        return res.status(400).json({ error: "Cannot ban yourself" });
      }
      
      // Require a reason when banning
      if (banned === true && (!reason || reason.trim() === "")) {
        return res.status(400).json({ error: "A ban reason is required" });
      }
      
      const [updatedUser] = await db.update(users)
        .set({ 
          banned: banned === true, 
          banReason: banned === true ? reason.trim() : null,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Failed to ban/unban user:", error);
      res.status(500).json({ error: "Failed to update user ban status" });
    }
  });

  // ============= OWNER-ONLY ROUTES =============

  // Grant/revoke admin privileges (owner only)
  app.post("/api/owner/users/:userId/admin", isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user?.claims?.sub;
      if (!isOwner(ownerId)) {
        return res.status(403).json({ error: "Owner access required" });
      }
      
      const { userId } = req.params;
      const { isAdmin: grantAdmin } = req.body;
      
      // Cannot change owner's admin status
      if (userId === OWNER_USER_ID) {
        return res.status(400).json({ error: "Cannot modify owner privileges" });
      }
      
      const [updatedUser] = await db.update(users)
        .set({ isAdmin: grantAdmin === true, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Failed to update admin status:", error);
      res.status(500).json({ error: "Failed to update admin status" });
    }
  });

  // Grant admin by username/email (owner only)
  app.post("/api/owner/grant-admin", isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user?.claims?.sub;
      if (!isOwner(ownerId)) {
        return res.status(403).json({ error: "Owner access required" });
      }
      
      const { username } = req.body;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: "Username is required" });
      }
      
      // Search by firstName or email (case insensitive)
      const matchingUsers = await db.select().from(users).where(
        or(
          ilike(users.firstName, username),
          ilike(users.email, username),
          ilike(users.email, `${username}%`)
        )
      );
      
      if (matchingUsers.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const targetUser = matchingUsers[0];
      
      // Cannot change owner's admin status
      if (targetUser.id === OWNER_USER_ID) {
        return res.status(400).json({ error: "Cannot modify owner privileges" });
      }
      
      const [updatedUser] = await db.update(users)
        .set({ isAdmin: true, updatedAt: new Date() })
        .where(eq(users.id, targetUser.id))
        .returning();
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Failed to grant admin:", error);
      res.status(500).json({ error: "Failed to grant admin privileges" });
    }
  });

  // Get tags for a user
  app.get("/api/users/:userId/tags", async (req, res) => {
    try {
      const { userId } = req.params;
      const tags = await db.select().from(userTags).where(eq(userTags.userId, userId));
      res.json(tags);
    } catch (error) {
      console.error("Failed to get user tags:", error);
      res.status(500).json({ error: "Failed to get tags" });
    }
  });

  // Add a tag to a user (owner only)
  app.post("/api/owner/users/:userId/tags", isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user?.claims?.sub;
      if (!isOwner(ownerId)) {
        return res.status(403).json({ error: "Owner access required" });
      }
      
      const { userId } = req.params;
      const { name, color } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Tag name is required" });
      }
      
      const tagData = insertUserTagSchema.parse({
        userId,
        name: name.trim(),
        color: color || "#3b82f6",
      });
      
      const [newTag] = await db.insert(userTags).values(tagData).returning();
      res.json(newTag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tag data", details: error.errors });
      }
      console.error("Failed to add tag:", error);
      res.status(500).json({ error: "Failed to add tag" });
    }
  });

  // Remove a tag (owner only)
  app.delete("/api/owner/tags/:tagId", isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user?.claims?.sub;
      if (!isOwner(ownerId)) {
        return res.status(403).json({ error: "Owner access required" });
      }
      
      const { tagId } = req.params;
      await db.delete(userTags).where(eq(userTags.id, tagId));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete tag:", error);
      res.status(500).json({ error: "Failed to delete tag" });
    }
  });

  // Check if current user is banned
  app.get("/api/auth/ban-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.json({ banned: false, reason: null });
      }
      
      res.json({ banned: user.banned === true, reason: user.banReason || null });
    } catch (error) {
      console.error("Failed to check ban status:", error);
      res.status(500).json({ error: "Failed to check ban status" });
    }
  });

  // Check if a previously banned user has been unbanned (public endpoint for banned users)
  app.get("/api/auth/unban-check/:userId", async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.json({ stillBanned: true });
      }
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.json({ stillBanned: true });
      }
      
      res.json({ stillBanned: user.banned === true });
    } catch (error) {
      console.error("Failed to check unban status:", error);
      res.json({ stillBanned: true });
    }
  });

  // ============= DESKTOP AUTH ROUTES =============
  // Store for desktop login codes (code -> { userId, userName, email, expiresAt })
  const desktopLoginCodes = new Map<string, { userId: string; userName: string; email: string; expiresAt: number }>();

  // Generate a random 6-character code
  function generateDesktopCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Clean up expired codes periodically
  setInterval(() => {
    const now = Date.now();
    desktopLoginCodes.forEach((value, key) => {
      if (value.expiresAt < now) {
        desktopLoginCodes.delete(key);
      }
    });
  }, 60000); // Every minute

  // Generate a desktop login code (for logged-in users on the website)
  app.get("/api/desktop-auth/code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userName = req.user?.claims?.first_name || req.user?.claims?.email?.split('@')[0] || "User";
      const email = req.user?.claims?.email || "";

      // Generate a new code
      const code = generateDesktopCode();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      desktopLoginCodes.set(code, { userId, userName, email, expiresAt });

      res.json({ code, expiresIn: 300 }); // 300 seconds
    } catch (error) {
      console.error("Failed to generate desktop code:", error);
      res.status(500).json({ error: "Failed to generate code" });
    }
  });

  // Validate a desktop login code (for the Electron app)
  app.post("/api/desktop-auth/login", async (req: any, res) => {
    try {
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Code is required" });
      }

      const upperCode = code.toUpperCase().trim();
      const loginData = desktopLoginCodes.get(upperCode);

      if (!loginData) {
        return res.status(401).json({ error: "Invalid or expired code" });
      }

      if (loginData.expiresAt < Date.now()) {
        desktopLoginCodes.delete(upperCode);
        return res.status(401).json({ error: "Code has expired" });
      }

      // Code is valid - delete it (one-time use)
      desktopLoginCodes.delete(upperCode);

      // Set the session for this user
      if (req.session) {
        req.session.desktopUserId = loginData.userId;
        req.session.desktopUserName = loginData.userName;
        req.session.desktopEmail = loginData.email;
      }

      res.json({ 
        success: true, 
        userId: loginData.userId,
        userName: loginData.userName,
        email: loginData.email
      });
    } catch (error) {
      console.error("Failed to validate desktop code:", error);
      res.status(500).json({ error: "Failed to validate code" });
    }
  });

  // Get desktop auth user (for Electron app)
  app.get("/api/desktop-auth/user", async (req: any, res) => {
    try {
      const desktopUserId = req.session?.desktopUserId;
      
      if (!desktopUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get user from database
      const [user] = await db.select().from(users).where(eq(users.id, desktopUserId));
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching desktop user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============= CHAT ROUTES =============

  // Get global chat messages
  app.get("/api/chat/global", async (req, res) => {
    try {
      const globalMessages = await db.select()
        .from(messages)
        .where(eq(messages.isGlobal, true))
        .orderBy(desc(messages.createdAt))
        .limit(100);
      
      // Add owner/admin/banned status and tags for each sender
      const messagesWithRoles = await Promise.all(globalMessages.map(async (msg) => {
        const senderIsOwner = msg.senderId === OWNER_USER_ID;
        const [senderUser] = await db.select().from(users).where(eq(users.id, msg.senderId));
        const senderIsAdmin = senderIsOwner || senderUser?.isAdmin === true;
        const senderIsBanned = senderUser?.banned === true;
        const senderTags = await db.select().from(userTags).where(eq(userTags.userId, msg.senderId));
        return { ...msg, senderIsOwner, senderIsAdmin, senderIsBanned, senderTags };
      }));
      
      res.json(messagesWithRoles.reverse());
    } catch (error) {
      console.error("Failed to fetch global messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a global chat message
  app.post("/api/chat/global", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userName = req.user?.claims?.first_name || req.user?.claims?.email || "Anonymous";
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const messageData = insertMessageSchema.parse({
        senderId: userId,
        senderName: userName,
        content: content.trim(),
        isGlobal: true,
        recipientId: null,
      });

      const [newMessage] = await db.insert(messages).values(messageData).returning();
      
      res.json(newMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      console.error("Failed to send global message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get direct messages between current user and another user
  app.get("/api/chat/direct/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      const otherUserId = req.params.userId;
      
      const directMessages = await db.select()
        .from(messages)
        .where(
          and(
            eq(messages.isGlobal, false),
            or(
              and(eq(messages.senderId, currentUserId), eq(messages.recipientId, otherUserId)),
              and(eq(messages.senderId, otherUserId), eq(messages.recipientId, currentUserId))
            )
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(100);
      
      // Add owner/admin/banned status and tags for each sender
      const messagesWithRoles = await Promise.all(directMessages.map(async (msg) => {
        const senderIsOwner = msg.senderId === OWNER_USER_ID;
        const [senderUser] = await db.select().from(users).where(eq(users.id, msg.senderId));
        const senderIsAdmin = senderIsOwner || senderUser?.isAdmin === true;
        const senderIsBanned = senderUser?.banned === true;
        const senderTags = await db.select().from(userTags).where(eq(userTags.userId, msg.senderId));
        return { ...msg, senderIsOwner, senderIsAdmin, senderIsBanned, senderTags };
      }));
      
      res.json(messagesWithRoles.reverse());
    } catch (error) {
      console.error("Failed to fetch direct messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a direct message
  app.post("/api/chat/direct/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user?.claims?.sub;
      const senderName = req.user?.claims?.first_name || req.user?.claims?.email || "Anonymous";
      const recipientId = req.params.userId;
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const messageData = insertMessageSchema.parse({
        senderId,
        senderName,
        recipientId,
        content: content.trim(),
        isGlobal: false,
      });

      const [newMessage] = await db.insert(messages).values(messageData).returning();
      
      res.json(newMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      console.error("Failed to send direct message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Delete a message (sender or admin can delete messages)
  app.delete("/api/chat/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const messageId = req.params.messageId;
      
      if (!messageId) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      // Find the message first
      const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
      
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if the current user is an admin or owner
      const isOwner = userId === OWNER_USER_ID;
      const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
      const isAdmin = isOwner || dbUser?.isAdmin === true;

      // Check if the current user is the sender or an admin
      if (message.senderId !== userId && !isAdmin) {
        return res.status(403).json({ error: "You can only delete your own messages" });
      }

      await db.delete(messages).where(eq(messages.id, messageId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Search users by username/email for starting a chat
  app.get("/api/chat/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      const currentUserId = req.user?.claims?.sub;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const foundUsers = await db.select()
        .from(users)
        .where(
          or(
            ilike(users.email, `%${query}%`),
            ilike(users.firstName, `%${query}%`),
            ilike(users.lastName, `%${query}%`)
          )
        )
        .limit(10);
      
      // Filter out current user
      const filteredUsers = foundUsers.filter(u => u.id !== currentUserId);
      res.json(filteredUsers);
    } catch (error) {
      console.error("Failed to search users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Get list of users the current user has chatted with
  app.get("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      
      // Get all direct messages involving current user
      const userMessages = await db.select()
        .from(messages)
        .where(
          and(
            eq(messages.isGlobal, false),
            or(
              eq(messages.senderId, currentUserId),
              eq(messages.recipientId, currentUserId)
            )
          )
        )
        .orderBy(desc(messages.createdAt));
      
      // Extract unique user IDs
      const userIds = new Set<string>();
      const conversations: { id: string; name: string; lastMessage: string; lastMessageTime: string }[] = [];
      
      for (const msg of userMessages) {
        const otherId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
        if (otherId && !userIds.has(otherId)) {
          userIds.add(otherId);
          // Find the user
          const [user] = await db.select().from(users).where(eq(users.id, otherId));
          if (user && user.id) {
            conversations.push({
              id: user.id,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
              lastMessage: msg.content.substring(0, 50),
              lastMessageTime: msg.createdAt,
            });
          }
        }
      }
      
      res.json(conversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get current shutdown status
  app.get("/api/shutdown/status", (req, res) => {
    res.json(shutdownState);
  });

  // Initiate shutdown (admin only)
  app.post("/api/shutdown", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (shutdownState.isShutdown || shutdownState.isShuttingDown) {
        return res.status(400).json({ error: "System is already shutting down or shutdown" });
      }

      shutdownState = {
        isShutdown: false,
        isShuttingDown: true,
        shutdownTime: Date.now() + 60000, // 60 seconds from now
        message: "System going down for maintenance in 60 seconds!",
        reason: null,
      };

      broadcastShutdownStatus();

      // Schedule the actual shutdown
      setTimeout(() => {
        if (shutdownState.isShuttingDown) {
          shutdownState = {
            isShutdown: true,
            isShuttingDown: false,
            shutdownTime: null,
            message: "Shutdown for maintenance",
            reason: null,
          };
          broadcastShutdownStatus();
        }
      }, 60000);

      res.json({ success: true, message: "Shutdown initiated" });
    } catch (error) {
      console.error("Failed to initiate shutdown:", error);
      res.status(500).json({ error: "Failed to initiate shutdown" });
    }
  });

  // Instant shutdown (admin only) - no countdown
  app.post("/api/shutdown/instant", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const reason = req.body?.reason;
      shutdownState = {
        isShutdown: true,
        isShuttingDown: false,
        shutdownTime: null,
        message: "System shutdown by administrator",
        reason: reason || null,
      };

      broadcastShutdownStatus();

      res.json({ success: true, message: "Instant shutdown executed" });
    } catch (error) {
      console.error("Failed to execute instant shutdown:", error);
      res.status(500).json({ error: "Failed to execute instant shutdown" });
    }
  });

  // Stop shutdown (admin only)
  app.post("/api/shutdown/stop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      shutdownState = {
        isShutdown: false,
        isShuttingDown: false,
        shutdownTime: null,
        message: "",
        reason: null,
      };

      broadcastShutdownStatus();

      res.json({ success: true, message: "Shutdown cancelled" });
    } catch (error) {
      console.error("Failed to stop shutdown:", error);
      res.status(500).json({ error: "Failed to stop shutdown" });
    }
  });

  // Bug Reports endpoints
  
  // Submit a bug report (authenticated users)
  app.post("/api/bug-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const claims = req.user?.claims || {};
      const realUserName = claims.name || 
        (claims.first_name && claims.last_name ? `${claims.first_name} ${claims.last_name}` : null) ||
        claims.first_name || 
        claims.email || 
        "User";
      const isAnonymous = req.body.anonymous === true;
      const userName = isAnonymous ? "Anonymous" : realUserName;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertBugReportSchema.parse({
        location: req.body.location,
        description: req.body.description,
        userId,
        userName,
      });

      const [newReport] = await db.insert(bugReports).values(validatedData).returning();
      res.json(newReport);
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid bug report data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to submit bug report" });
      }
    }
  });

  // Get all bug reports (admins/owners only)
  app.get("/api/bug-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !(await isUserAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allReports = await db.select().from(bugReports).orderBy(desc(bugReports.createdAt));
      res.json(allReports);
    } catch (error) {
      console.error("Failed to fetch bug reports:", error);
      res.status(500).json({ error: "Failed to fetch bug reports" });
    }
  });

  // Resolve (delete) bug report (owner only)
  app.delete("/api/bug-reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !isOwner(userId)) {
        return res.status(403).json({ error: "Owner access required" });
      }

      const { id } = req.params;

      const [deletedReport] = await db
        .delete(bugReports)
        .where(eq(bugReports.id, id))
        .returning();

      if (!deletedReport) {
        return res.status(404).json({ error: "Bug report not found" });
      }

      res.json({ success: true, message: "Bug report resolved and deleted" });
    } catch (error) {
      console.error("Failed to delete bug report:", error);
      res.status(500).json({ error: "Failed to delete bug report" });
    }
  });

  // User Presence endpoints
  
  // Update user presence
  app.post("/api/presence", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userName = req.user?.claims?.first_name || "User";
      const { status, activity } = req.body;
      
      const existingPresence = await db.select().from(userPresence).where(eq(userPresence.userId, userId)).limit(1);
      
      if (existingPresence.length > 0) {
        await db.update(userPresence)
          .set({ 
            status: status || "online",
            activity: activity || null,
            lastSeen: new Date().toISOString(),
          })
          .where(eq(userPresence.userId, userId));
      } else {
        await db.insert(userPresence).values({
          userId,
          userName,
          status: status || "online",
          activity: activity || null,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update presence:", error);
      res.status(500).json({ error: "Failed to update presence" });
    }
  });
  
  // Get online users
  app.get("/api/presence/online", isAuthenticated, async (req, res) => {
    try {
      const onlineUsers = await db.select().from(userPresence)
        .where(eq(userPresence.status, "online"));
      res.json(onlineUsers);
    } catch (error) {
      console.error("Failed to get online users:", error);
      res.status(500).json({ error: "Failed to get online users" });
    }
  });
  
  // Friends endpoints
  
  // Get friend list
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const friendsList = await db.select().from(friends)
        .where(or(
          and(eq(friends.userId, userId), eq(friends.status, "accepted")),
          and(eq(friends.friendId, userId), eq(friends.status, "accepted"))
        ));
      
      res.json(friendsList);
    } catch (error) {
      console.error("Failed to get friends:", error);
      res.status(500).json({ error: "Failed to get friends" });
    }
  });
  
  // Get friend requests (pending)
  app.get("/api/friends/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const requests = await db.select().from(friends)
        .where(and(eq(friends.friendId, userId), eq(friends.status, "pending")));
      
      res.json(requests);
    } catch (error) {
      console.error("Failed to get friend requests:", error);
      res.status(500).json({ error: "Failed to get friend requests" });
    }
  });
  
  // Send friend request (by email or username)
  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { identifier } = req.body;
      
      if (!identifier || !identifier.trim()) {
        return res.status(400).json({ error: "Please provide an email or username" });
      }
      
      const searchTerm = identifier.trim().toLowerCase();
      
      // Look up user by email or username (firstName)
      const foundUsers = await db.select().from(users)
        .where(or(
          eq(users.email, searchTerm),
          sql`LOWER(${users.firstName}) = ${searchTerm}`
        ));
      
      if (foundUsers.length === 0) {
        return res.status(404).json({ error: "User not found. Check the email or username." });
      }
      
      const friendId = foundUsers[0].id;
      
      if (userId === friendId) {
        return res.status(400).json({ error: "Cannot add yourself as a friend" });
      }
      
      // Check if request already exists
      const existing = await db.select().from(friends)
        .where(or(
          and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userId))
        ));
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Friend request already exists or you're already friends" });
      }
      
      await db.insert(friends).values({
        userId,
        friendId,
        status: "pending",
      });
      
      res.json({ success: true, message: `Friend request sent to ${foundUsers[0].firstName || foundUsers[0].email}` });
    } catch (error) {
      console.error("Failed to send friend request:", error);
      res.status(500).json({ error: "Failed to send friend request" });
    }
  });
  
  // Accept friend request
  app.post("/api/friends/accept/:requestId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { requestId } = req.params;
      
      const request = await db.select().from(friends)
        .where(and(eq(friends.id, requestId), eq(friends.friendId, userId)));
      
      if (request.length === 0) {
        return res.status(404).json({ error: "Friend request not found" });
      }
      
      await db.update(friends)
        .set({ status: "accepted" })
        .where(eq(friends.id, requestId));
      
      res.json({ success: true, message: "Friend request accepted" });
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });
  
  // Decline/remove friend
  app.delete("/api/friends/:friendshipId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { friendshipId } = req.params;
      
      await db.delete(friends)
        .where(and(
          eq(friends.id, friendshipId),
          or(eq(friends.userId, userId), eq(friends.friendId, userId))
        ));
      
      res.json({ success: true, message: "Friend removed" });
    } catch (error) {
      console.error("Failed to remove friend:", error);
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  // ============= EMAIL ROUTES =============

  // Get user's emails (inbox and sent)
  app.get("/api/emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const inbox = await db.select().from(emails)
        .where(eq(emails.toUserId, userId))
        .orderBy(desc(emails.createdAt));
      
      const sent = await db.select().from(emails)
        .where(eq(emails.fromUserId, userId))
        .orderBy(desc(emails.createdAt));
      
      res.json({ inbox, sent });
    } catch (error) {
      console.error("Failed to get emails:", error);
      res.status(500).json({ error: "Failed to get emails" });
    }
  });

  // Send an email
  app.post("/api/emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const [sender] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!sender) {
        return res.status(401).json({ error: "User not found" });
      }

      const { toEmail, subject, body } = req.body;
      
      if (!toEmail || !subject) {
        return res.status(400).json({ error: "Recipient email and subject are required" });
      }

      // Parse the nexusos email to find the user
      // Format is username@nexusos.live or firstname@nexusos.live
      const recipientUsername = toEmail.split("@")[0].toLowerCase();
      
      // Find recipient by firstName or email prefix
      const recipients = await db.select().from(users)
        .where(or(
          ilike(users.firstName, recipientUsername),
          sql`LOWER(SPLIT_PART(${users.email}, '@', 1)) = ${recipientUsername}`
        ));
      
      if (recipients.length === 0) {
        return res.status(404).json({ error: "Recipient not found. Make sure they have a NexusOS account." });
      }

      const recipient = recipients[0];
      
      // Create sender's email address
      const senderEmailAddress = sender.firstName 
        ? `${sender.firstName}@nexusos.live`
        : `${sender.email?.split("@")[0]}@nexusos.live`;
      
      const senderName = sender.firstName || sender.email?.split("@")[0] || "Unknown";

      // Insert email for recipient (inbox)
      console.log("Sending email:", {
        fromUserId: userId,
        fromName: senderName,
        fromEmail: senderEmailAddress,
        toUserId: recipient.id,
        toEmail: toEmail,
        subject,
      });
      
      const insertResult = await db.insert(emails).values({
        fromUserId: userId,
        fromName: senderName,
        fromEmail: senderEmailAddress,
        toUserId: recipient.id,
        toEmail: toEmail,
        subject,
        body: body || "",
        folder: "inbox",
      }).returning();
      
      console.log("Email inserted:", insertResult);

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Failed to send email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Search users for email autocomplete
  app.get("/api/emails/search-users", isAuthenticated, async (req: any, res) => {
    try {
      const { query } = req.query;
      const currentUserId = req.user?.claims?.sub;
      
      if (!query || query.length < 1) {
        return res.json([]);
      }

      const searchQuery = query.toLowerCase();
      
      // Find users whose firstName or email prefix matches the query
      const matchingUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        email: users.email,
      }).from(users)
        .where(and(
          or(
            ilike(users.firstName, `%${searchQuery}%`),
            sql`LOWER(SPLIT_PART(${users.email}, '@', 1)) LIKE ${'%' + searchQuery + '%'}`
          ),
          sql`${users.id} != ${currentUserId}` // Exclude current user
        ))
        .limit(10);

      // Format as nexusos emails
      const suggestions = matchingUsers.map(user => {
        const nexusEmail = user.firstName 
          ? `${user.firstName}@nexusos.live`
          : `${user.email?.split("@")[0]}@nexusos.live`;
        return {
          email: nexusEmail,
          name: user.firstName || user.email?.split("@")[0] || "User",
        };
      });

      res.json(suggestions);
    } catch (error) {
      console.error("Failed to search users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Mark email as read/unread
  app.patch("/api/emails/:emailId/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { emailId } = req.params;
      const { isRead } = req.body;

      await db.update(emails)
        .set({ isRead })
        .where(and(eq(emails.id, emailId), eq(emails.toUserId, userId)));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update email:", error);
      res.status(500).json({ error: "Failed to update email" });
    }
  });

  // Toggle star on email
  app.patch("/api/emails/:emailId/star", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { emailId } = req.params;
      const { isStarred } = req.body;

      await db.update(emails)
        .set({ isStarred })
        .where(and(
          eq(emails.id, emailId),
          or(eq(emails.toUserId, userId), eq(emails.fromUserId, userId))
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to star email:", error);
      res.status(500).json({ error: "Failed to star email" });
    }
  });

  // Move email to folder (trash, archive)
  app.patch("/api/emails/:emailId/folder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { emailId } = req.params;
      const { folder } = req.body;

      await db.update(emails)
        .set({ folder })
        .where(and(
          eq(emails.id, emailId),
          or(eq(emails.toUserId, userId), eq(emails.fromUserId, userId))
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to move email:", error);
      res.status(500).json({ error: "Failed to move email" });
    }
  });

  // Delete email permanently
  app.delete("/api/emails/:emailId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { emailId } = req.params;

      await db.delete(emails)
        .where(and(
          eq(emails.id, emailId),
          or(eq(emails.toUserId, userId), eq(emails.fromUserId, userId))
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete email:", error);
      res.status(500).json({ error: "Failed to delete email" });
    }
  });

  // Download NexusOS Desktop app
  app.get("/api/download/nexusos-desktop", (req, res) => {
    try {
      const electronAppPath = path.join(process.cwd(), "server", "electron-app");
      
      // Check if the directory exists
      if (!fs.existsSync(electronAppPath)) {
        return res.status(404).json({ error: "Download not available" });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=NexusOS-Desktop.zip");

      const archive = archiver("zip", { zlib: { level: 9 } });
      
      archive.on("error", (err: Error) => {
        console.error("Archive error:", err);
        res.status(500).json({ error: "Failed to create download" });
      });

      archive.pipe(res);
      archive.directory(electronAppPath, "NexusOS-Desktop");
      archive.finalize();
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to create download" });
    }
  });

  // Setup WebSocket server for real-time shutdown updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    wsClients.add(ws);
    
    // Send current shutdown status on connect
    ws.send(JSON.stringify({
      type: "shutdown_status",
      ...shutdownState,
    }));

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "join_meeting": {
            const { meetingId, userName } = message;
            if (!meetingId || !userName) return;
            
            // Remove from any previous meeting
            const existingClient = meetingClients.get(ws);
            if (existingClient) {
              broadcastToMeeting(existingClient.meetingId, {
                type: "participant_left",
                userName: existingClient.userName,
                participants: getMeetingParticipants(existingClient.meetingId).filter(n => n !== existingClient.userName),
              }, ws);
            }
            
            // Join new meeting
            meetingClients.set(ws, { ws, meetingId, userName, oderId: Date.now().toString() });
            
            const participants = getMeetingParticipants(meetingId);
            
            // Notify others that someone joined
            broadcastToMeeting(meetingId, {
              type: "participant_joined",
              userName,
              participants,
            }, ws);
            
            // Send participant list to the new joiner
            ws.send(JSON.stringify({
              type: "meeting_joined",
              meetingId,
              participants,
            }));
            break;
          }
          
          case "leave_meeting": {
            const client = meetingClients.get(ws);
            if (client) {
              meetingClients.delete(ws);
              broadcastToMeeting(client.meetingId, {
                type: "participant_left",
                userName: client.userName,
                participants: getMeetingParticipants(client.meetingId),
              });
            }
            break;
          }
          
          case "chat_message": {
            const client = meetingClients.get(ws);
            if (!client) return;
            
            const { text } = message;
            if (!text || typeof text !== "string") return;
            
            // Broadcast to all participants including sender
            broadcastToMeeting(client.meetingId, {
              type: "chat_message",
              id: Date.now().toString(),
              sender: client.userName,
              text: text.substring(0, 500), // Limit message length
              timestamp: new Date().toISOString(),
            });
            break;
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", () => {
      wsClients.delete(ws);
      
      // Handle meeting cleanup
      const client = meetingClients.get(ws);
      if (client) {
        meetingClients.delete(ws);
        broadcastToMeeting(client.meetingId, {
          type: "participant_left",
          userName: client.userName,
          participants: getMeetingParticipants(client.meetingId),
        });
      }
    });
  });

  return httpServer;
}
