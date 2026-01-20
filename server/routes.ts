import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { settingsSchema, insertUpdateSchema, insertMessageSchema, insertCustomAppSchema, insertBugReportSchema, users, messages, customApps, bugReports } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { updates } from "@shared/schema";
import { desc, eq, or, and, ilike } from "drizzle-orm";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import os from "os";

// Global shutdown state
let shutdownState = {
  isShutdown: false,
  isShuttingDown: false,
  shutdownTime: null as number | null,
  message: "",
};

// WebSocket clients for real-time updates
const wsClients = new Set<WebSocket>();

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const DEFAULT_USER_ID = "default-user";

  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Get admin status for current user
  app.get("/api/admin/status", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ isAdmin: false, isOwner: false, userId: null });
      }
      const adminStatus = await isUserAdmin(userId);
      const ownerStatus = isOwner(userId);
      res.json({ isAdmin: adminStatus, isOwner: ownerStatus, userId });
    } catch (error) {
      console.error("Failed to check admin status:", error);
      res.json({ isAdmin: false, isOwner: false, userId: null });
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
      const { banned } = req.body;
      
      // Prevent banning the owner or yourself
      if (userId === OWNER_USER_ID) {
        return res.status(400).json({ error: "Cannot ban the owner" });
      }
      if (userId === adminId) {
        return res.status(400).json({ error: "Cannot ban yourself" });
      }
      
      const [updatedUser] = await db.update(users)
        .set({ banned: banned === true, updatedAt: new Date() })
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

  // Check if current user is banned
  app.get("/api/auth/ban-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.json({ banned: false });
      }
      
      res.json({ banned: user.banned === true });
    } catch (error) {
      console.error("Failed to check ban status:", error);
      res.status(500).json({ error: "Failed to check ban status" });
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
      
      // Add owner/admin status for each sender
      const messagesWithRoles = await Promise.all(globalMessages.map(async (msg) => {
        const senderIsOwner = msg.senderId === OWNER_USER_ID;
        const [senderUser] = await db.select().from(users).where(eq(users.id, msg.senderId));
        const senderIsAdmin = senderIsOwner || senderUser?.isAdmin === true;
        return { ...msg, senderIsOwner, senderIsAdmin };
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
      
      // Add owner/admin status for each sender
      const messagesWithRoles = await Promise.all(directMessages.map(async (msg) => {
        const senderIsOwner = msg.senderId === OWNER_USER_ID;
        const [senderUser] = await db.select().from(users).where(eq(users.id, msg.senderId));
        const senderIsAdmin = senderIsOwner || senderUser?.isAdmin === true;
        return { ...msg, senderIsOwner, senderIsAdmin };
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

      shutdownState = {
        isShutdown: true,
        isShuttingDown: false,
        shutdownTime: null,
        message: "System shutdown by administrator",
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
      const userName = req.user?.claims?.name || "Anonymous";
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertBugReportSchema.parse({
        ...req.body,
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

  // Mark bug report as resolved (owner only)
  app.patch("/api/bug-reports/:id/resolve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId || !isOwner(userId)) {
        return res.status(403).json({ error: "Owner access required" });
      }

      const { id } = req.params;
      const { resolved } = req.body;

      const [updatedReport] = await db
        .update(bugReports)
        .set({ resolved: resolved ?? true })
        .where(eq(bugReports.id, id))
        .returning();

      if (!updatedReport) {
        return res.status(404).json({ error: "Bug report not found" });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error("Failed to update bug report:", error);
      res.status(500).json({ error: "Failed to update bug report" });
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

    ws.on("close", () => {
      wsClients.delete(ws);
    });
  });

  return httpServer;
}
