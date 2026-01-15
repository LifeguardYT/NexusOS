import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { settingsSchema } from "@shared/schema";
import { z } from "zod";
import https from "https";
import http from "http";

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

  // Web proxy endpoint for browser app
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: "URL parameter required" });
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const protocol = parsedUrl.protocol === "https:" ? https : http;
      
      const proxyReq = protocol.request(
        targetUrl,
        {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        },
        (proxyRes) => {
          let body = "";
          
          proxyRes.on("data", (chunk) => {
            body += chunk;
          });
          
          proxyRes.on("end", () => {
            // Get content type
            const contentType = proxyRes.headers["content-type"] || "text/html";
            
            // Set response headers, removing security headers that block embedding
            res.setHeader("Content-Type", contentType);
            res.setHeader("Access-Control-Allow-Origin", "*");
            
            // For HTML content, rewrite URLs to go through proxy
            if (contentType.includes("text/html")) {
              const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
              
              // Rewrite relative URLs to absolute
              body = body.replace(/(href|src|action)=["'](?!http|https|\/\/|data:|javascript:|#)([^"']+)["']/gi, 
                (match, attr, url) => {
                  const absoluteUrl = url.startsWith("/") 
                    ? `${baseUrl}${url}` 
                    : `${baseUrl}/${url}`;
                  return `${attr}="/api/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
                }
              );
              
              // Rewrite absolute URLs on same domain to go through proxy
              body = body.replace(new RegExp(`(href|src|action)=["'](${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([^"']+)["']`, "gi"),
                (match, attr, base, path) => {
                  return `${attr}="/api/proxy?url=${encodeURIComponent(base + path)}"`;
                }
              );
              
              // Add base tag for remaining relative URLs
              body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}/" target="_self">`);
            }
            
            res.send(body);
          });
        }
      );
      
      proxyReq.on("error", (err) => {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Failed to fetch URL" });
      });
      
      proxyReq.end();
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Invalid URL or request failed" });
    }
  });

  return httpServer;
}
