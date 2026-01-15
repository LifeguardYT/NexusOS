import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { settingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Settings API endpoints
  // For MVP, we use a default user ID since we don't have auth
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
      const updates = req.body;
      const settings = await storage.updateSettings(DEFAULT_USER_ID, updates);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  });

  return httpServer;
}
