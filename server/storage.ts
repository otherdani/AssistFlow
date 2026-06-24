import { type User, type InsertUser, type Session, type InsertSession, type UpdateSession } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  updateSession(id: string, updates: UpdateSession): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  getActiveSessions(): Promise<Session[]>;
  deleteSession(id: string): Promise<boolean>;
  clearAllSessions(): Promise<void>;

  sessionStore: session.Store;
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin() {
    try {
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error("[Storage] ADMIN_PASSWORD is not set — skipping default admin creation.");
        return;
      }

      const existingAdmin = await this.getUserByUsername(adminUsername);
      if (!existingAdmin) {
        await this.createUser({ username: adminUsername, password: adminPassword });
        console.log(`[Mem] Admin user '${adminUsername}' initialized`);
      }
    } catch (error) {
      console.error("Failed to initialize admin user:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await hashPassword(insertUser.password);
    const user: User = { ...insertUser, id, password: hashedPassword };
    this.users.set(id, user);
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const now = new Date();
    const sess: Session = {
      id,
      customerName: insertSession.customerName,
      customerEmail: insertSession.customerEmail || null,
      language: insertSession.language || "en",
      computerInfo: insertSession.computerInfo || null,
      issueDescription: insertSession.issueDescription || null,
      status: "preparing",
      securityCode: null,
      step1Completed: false,
      step2Completed: false,
      step3Completed: false,
      step4Completed: false,
      step5Completed: false,
      step6Completed: false,
      step7Completed: false,
      step8Completed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(id, sess);
    return sess;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async updateSession(id: string, updates: UpdateSession): Promise<Session | undefined> {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    const updated: Session = { ...existing, ...updates, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getActiveSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(s => s.status !== "completed")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async clearAllSessions(): Promise<void> {
    this.sessions.clear();
  }
}

// ── Storage singleton, chosen at startup ──────────────────────────────────────

let _storage: IStorage | null = null;

export async function initStorage(): Promise<IStorage> {
  if (_storage) return _storage;

  const useSql = !!(process.env.SQL_SERVER && process.env.SQL_DATABASE);

  if (useSql) {
    try {
      const { createSqlServerStorage } = await import("./sqlStorage");
      _storage = await createSqlServerStorage();
      console.log("[Storage] Using SQL Server storage");

      // Seed default admin if no users exist
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error("[Storage] ADMIN_PASSWORD is not set — skipping default admin creation.");
      } else {
        const existing = await _storage.getUserByUsername(adminUsername);
        if (!existing) {
          await _storage.createUser({ username: adminUsername, password: adminPassword });
          console.log(`[SQL] Default admin '${adminUsername}' created`);
        }
      }
    } catch (err) {
      console.error("[Storage] SQL Server connection failed, falling back to in-memory:", err);
      _storage = new MemStorage();
    }
  } else {
    console.log("[Storage] SQL_SERVER not configured — using in-memory storage");
    _storage = new MemStorage();
  }

  return _storage;
}

// Synchronous accessor used after initialization
export function getStorage(): IStorage {
  if (!_storage) throw new Error("Storage not initialized — call initStorage() first");
  return _storage;
}

// Legacy export for code that imported `storage` directly
export const storage = new Proxy({} as IStorage, {
  get(_target, prop) {
    return (getStorage() as any)[prop];
  },
});
