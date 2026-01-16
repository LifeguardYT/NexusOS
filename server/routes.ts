import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { settingsSchema, insertUpdateSchema, insertMessageSchema, users, messages } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { updates } from "@shared/schema";
import { desc, eq, or, and, ilike } from "drizzle-orm";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import os from "os";

// Admin user ID - set this to your Replit user ID
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const DEFAULT_USER_ID = "default-user";

  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Get admin status for current user
  app.get("/api/admin/status", (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const isAdmin = userId && userId === ADMIN_USER_ID;
    res.json({ isAdmin, userId });
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
      if (userId !== ADMIN_USER_ID) {
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
      if (userId !== ADMIN_USER_ID) {
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

  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (userId !== ADMIN_USER_ID) {
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
      if (userId !== ADMIN_USER_ID) {
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
      if (userId !== ADMIN_USER_ID) {
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

  // ============= CHAT ROUTES =============

  // Get global chat messages
  app.get("/api/chat/global", async (req, res) => {
    try {
      const globalMessages = await db.select()
        .from(messages)
        .where(eq(messages.isGlobal, true))
        .orderBy(desc(messages.createdAt))
        .limit(100);
      res.json(globalMessages.reverse());
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
      
      res.json(directMessages.reverse());
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

  return httpServer;
}
