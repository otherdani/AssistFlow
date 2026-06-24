import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema, updateSessionSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, requireAuth } from "./auth";
import { statusManager } from "./statusManager";

// Helper to get the SQL storage if available (for SQL-only features)
async function getSqlStorage() {
  try {
    const { getStorage } = await import("./storage");
    const s = getStorage() as any;
    if (typeof s.logAudit === "function") return s;
  } catch {}
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // ── Status ────────────────────────────────────────────────────────────────

  app.get("/api/status", async (req, res) => {
    try {
      res.json(statusManager.getCurrentStatus());
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  app.patch("/api/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["available", "away", "assisting", "offline"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const updatedStatus = statusManager.updateStatus(status);

      // Audit log (non-blocking)
      getSqlStorage().then(sql => {
        if (sql && req.user) {
          sql.logAudit({
            adminUsername: (req.user as any).username,
            action: "status_change",
            details: `Status changed to: ${status}`,
            ipAddress: req.ip,
          });
        }
      });

      res.json(updatedStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ── Sessions ──────────────────────────────────────────────────────────────

  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/active", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getActiveSessions());
    } catch {
      res.status(500).json({ error: "Failed to fetch active sessions" });
    }
  });

  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getAllSessions());
    } catch {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json(session);
    } catch {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const validatedData = updateSessionSchema.parse(req.body);
      if (validatedData.securityCode && !req.isAuthenticated()) {
        delete validatedData.securityCode;
      }
      const session = await storage.updateSession(req.params.id, validatedData);
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.post("/api/sessions/:id/security-code", requireAuth, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const { securityCode } = req.body;

      if (!securityCode || typeof securityCode !== "string") {
        return res.status(400).json({ error: "Security code is required" });
      }
      if (!/^[A-Z0-9]{6}$/.test(securityCode)) {
        return res.status(400).json({ error: "Security code must be exactly 6 alphanumeric characters" });
      }

      const existing = await storage.getSession(sessionId);
      if (!existing) return res.status(404).json({ error: "Session not found" });

      const updated = await storage.updateSession(sessionId, { securityCode });
      if (!updated) return res.status(500).json({ error: "Failed to update session with security code" });

      // Audit log
      getSqlStorage().then(sql => {
        if (sql && req.user) {
          sql.logAudit({
            adminUsername: (req.user as any).username,
            action: "security_code_set",
            targetType: "session",
            targetId: sessionId,
            ipAddress: req.ip,
          });
        }
      });

      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to set security code" });
    }
  });

  app.delete("/api/sessions/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Session not found" });

      getSqlStorage().then(sql => {
        if (sql && req.user) {
          sql.logAudit({
            adminUsername: (req.user as any).username,
            action: "session_deleted",
            targetType: "session",
            targetId: req.params.id,
            ipAddress: req.ip,
          });
        }
      });

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.delete("/api/sessions", requireAuth, async (req, res) => {
    try {
      await storage.clearAllSessions();

      getSqlStorage().then(sql => {
        if (sql && req.user) {
          sql.logAudit({
            adminUsername: (req.user as any).username,
            action: "all_sessions_cleared",
            ipAddress: req.ip,
          });
        }
      });

      res.sendStatus(204);
    } catch {
      res.status(500).json({ error: "Failed to clear sessions" });
    }
  });

  // ── Statistics (SQL Server only, graceful fallback) ───────────────────────

  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const sql = await getSqlStorage();
      if (sql) {
        res.json(await sql.getSessionStats());
      } else {
        // Compute from in-memory
        const all = await storage.getAllSessions();
        const today = new Date();
        res.json({
          total: all.length,
          active: all.filter(s => s.status !== "completed").length,
          completed: all.filter(s => s.status === "completed").length,
          today: all.filter(s => {
            const d = new Date(s.createdAt);
            return d.getFullYear() === today.getFullYear() &&
              d.getMonth() === today.getMonth() &&
              d.getDate() === today.getDate();
          }).length,
        });
      }
    } catch {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ── Audit log (SQL Server only) ───────────────────────────────────────────

  app.get("/api/audit-log", requireAuth, async (req, res) => {
    try {
      const sql = await getSqlStorage();
      if (!sql) return res.json([]);
      const limit = Math.min(parseInt(req.query.limit as string || "100", 10), 500);
      res.json(await sql.getAuditLog(limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });

  // ── Admin user management (SQL Server only) ───────────────────────────────

  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const sql = await getSqlStorage();
      if (!sql) return res.json([{ id: "mem", username: (req.user as any)?.username }]);
      res.json(await sql.getAllUsers());
    } catch {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const sql = await getSqlStorage();
      if (!sql) return res.status(503).json({ error: "User management requires SQL Server" });

      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Username and password required" });
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ error: "Username already exists" });

      const user = await sql.createAdminUser(username, password);

      getSqlStorage().then(s => {
        if (s && req.user) {
          s.logAudit({
            adminUsername: (req.user as any).username,
            action: "admin_user_created",
            targetType: "user",
            targetId: user.id,
            details: `Created admin user: ${username}`,
            ipAddress: req.ip,
          });
        }
      });

      res.status(201).json(user);
    } catch {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const sql = await getSqlStorage();
      if (!sql) return res.status(503).json({ error: "User management requires SQL Server" });

      // Prevent deleting yourself
      if ((req.user as any)?.id === req.params.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const deleted = await sql.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ error: "User not found" });

      getSqlStorage().then(s => {
        if (s && req.user) {
          s.logAudit({
            adminUsername: (req.user as any).username,
            action: "admin_user_deleted",
            targetType: "user",
            targetId: req.params.id,
            ipAddress: req.ip,
          });
        }
      });

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/admin/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const { comparePasswords } = await import("./auth");
      const user = await storage.getUser((req.user as any).id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const valid = await comparePasswords(currentPassword, user.password);
      if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

      const sql = await getSqlStorage();
      if (sql) {
        await sql.changePassword(user.id, newPassword);
      } else {
        // In-memory: update directly via createUser path workaround
        const { hashPassword } = await import("./auth");
        (user as any).password = await hashPassword(newPassword);
      }

      getSqlStorage().then(s => {
        if (s && req.user) {
          s.logAudit({
            adminUsername: (req.user as any).username,
            action: "password_changed",
            ipAddress: req.ip,
          });
        }
      });

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // ── Storage info ──────────────────────────────────────────────────────────

  app.get("/api/storage-info", requireAuth, async (req, res) => {
    const usingSql = !!(process.env.SQL_SERVER && process.env.SQL_DATABASE);
    res.json({
      type: usingSql ? "sqlserver" : "memory",
      server: usingSql ? process.env.SQL_SERVER : null,
      database: usingSql ? process.env.SQL_DATABASE : null,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
