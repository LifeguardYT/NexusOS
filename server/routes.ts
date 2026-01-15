import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { settingsSchema, insertUpdateSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { updates } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const DEFAULT_USER_ID = "default-user";

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings(DEFAULT_USER_ID);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const updateData = req.body;
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

  // Create a new update
  app.post("/api/updates", async (req, res) => {
    try {
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

  // Delete an update
  app.delete("/api/updates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(updates).where(eq(updates.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete update:", error);
      res.status(500).json({ error: "Failed to delete update" });
    }
  });

  return httpServer;
}
