import sql from "mssql";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomUUID } from "crypto";
import { type User, type InsertUser, type Session, type InsertSession, type UpdateSession } from "@shared/schema";
import { type IStorage } from "./storage";
import { hashPassword } from "./auth";

const MemoryStore = createMemoryStore(session);

// SQL Server connection configuration from environment variables
function getSqlConfig(): sql.config {
  return {
    server: process.env.SQL_SERVER || "localhost",
    port: parseInt(process.env.SQL_PORT || "1433", 10),
    database: process.env.SQL_DATABASE || "ITSupport",
    user: process.env.SQL_USER || "",
    password: process.env.SQL_PASSWORD || "",
    options: {
      encrypt: process.env.SQL_ENCRYPT === "true",
      trustServerCertificate: process.env.SQL_TRUST_CERT !== "false", // default true for local
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
  };
}

// Initialize the database tables
async function initializeSchema(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
      username NVARCHAR(255) NOT NULL UNIQUE,
      password NVARCHAR(512) NOT NULL,
      role NVARCHAR(50) NOT NULL DEFAULT 'admin',
      created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='support_sessions' AND xtype='U')
    CREATE TABLE support_sessions (
      id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
      customer_name NVARCHAR(255) NOT NULL,
      customer_email NVARCHAR(255),
      language NVARCHAR(10) NOT NULL DEFAULT 'en',
      status NVARCHAR(50) NOT NULL DEFAULT 'preparing',
      security_code NVARCHAR(10),
      step1_completed BIT NOT NULL DEFAULT 0,
      step2_completed BIT NOT NULL DEFAULT 0,
      step3_completed BIT NOT NULL DEFAULT 0,
      step4_completed BIT NOT NULL DEFAULT 0,
      step5_completed BIT NOT NULL DEFAULT 0,
      step6_completed BIT NOT NULL DEFAULT 0,
      step7_completed BIT NOT NULL DEFAULT 0,
      step8_completed BIT NOT NULL DEFAULT 0,
      computer_info NVARCHAR(MAX),
      issue_description NVARCHAR(MAX),
      created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
      updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_log' AND xtype='U')
    CREATE TABLE audit_log (
      id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
      admin_username NVARCHAR(255) NOT NULL,
      action NVARCHAR(255) NOT NULL,
      target_type NVARCHAR(100),
      target_id NVARCHAR(36),
      details NVARCHAR(MAX),
      ip_address NVARCHAR(45),
      created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  console.log("[SQL] Database schema initialized");
}

// Map a SQL row to a User object
function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
  };
}

// Map a SQL row to a Session object
function rowToSession(row: any): Session {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email ?? null,
    language: row.language as "en" | "hu",
    status: row.status as "preparing" | "ready" | "in_progress" | "completed",
    securityCode: row.security_code ?? null,
    step1Completed: !!row.step1_completed,
    step2Completed: !!row.step2_completed,
    step3Completed: !!row.step3_completed,
    step4Completed: !!row.step4_completed,
    step5Completed: !!row.step5_completed,
    step6Completed: !!row.step6_completed,
    step7Completed: !!row.step7_completed,
    step8Completed: !!row.step8_completed,
    computerInfo: row.computer_info ?? null,
    issueDescription: row.issue_description ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface AuditLog {
  id: string;
  adminUsername: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface ISqlStorage extends IStorage {
  logAudit(entry: {
    adminUsername: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void>;
  getAuditLog(limit?: number): Promise<AuditLog[]>;
  changePassword(userId: string, newPassword: string): Promise<boolean>;
  getAllUsers(): Promise<Omit<User, "password">[]>;
  createAdminUser(username: string, password: string): Promise<Omit<User, "password">>;
  deleteUser(id: string): Promise<boolean>;
  getSessionStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    today: number;
  }>;
}

export class SqlServerStorage implements ISqlStorage {
  private pool: sql.ConnectionPool;
  public sessionStore: session.Store;

  constructor(pool: sql.ConnectionPool) {
    this.pool = pool;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // ── User methods ──────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.pool.request()
      .input("id", sql.NVarChar, id)
      .query("SELECT * FROM users WHERE id = @id");
    if (!result.recordset[0]) return undefined;
    return rowToUser(result.recordset[0]);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.request()
      .input("username", sql.NVarChar, username)
      .query("SELECT * FROM users WHERE username = @username");
    if (!result.recordset[0]) return undefined;
    return rowToUser(result.recordset[0]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashed = await hashPassword(insertUser.password);
    await this.pool.request()
      .input("id", sql.NVarChar, id)
      .input("username", sql.NVarChar, insertUser.username)
      .input("password", sql.NVarChar, hashed)
      .query("INSERT INTO users (id, username, password) VALUES (@id, @username, @password)");
    return { id, username: insertUser.username, password: hashed };
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashed = await hashPassword(newPassword);
    const result = await this.pool.request()
      .input("id", sql.NVarChar, userId)
      .input("password", sql.NVarChar, hashed)
      .query("UPDATE users SET password = @password WHERE id = @id");
    return (result.rowsAffected[0] ?? 0) > 0;
  }

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    const result = await this.pool.request()
      .query("SELECT id, username FROM users ORDER BY username");
    return result.recordset.map(r => ({ id: r.id, username: r.username }));
  }

  async createAdminUser(username: string, password: string): Promise<Omit<User, "password">> {
    const user = await this.createUser({ username, password });
    return { id: user.id, username: user.username };
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.pool.request()
      .input("id", sql.NVarChar, id)
      .query("DELETE FROM users WHERE id = @id");
    return (result.rowsAffected[0] ?? 0) > 0;
  }

  // ── Support session methods ───────────────────────────────────────────────

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    await this.pool.request()
      .input("id", sql.NVarChar, id)
      .input("customerName", sql.NVarChar, insertSession.customerName)
      .input("customerEmail", sql.NVarChar, insertSession.customerEmail ?? null)
      .input("language", sql.NVarChar, insertSession.language ?? "en")
      .input("computerInfo", sql.NVarChar, insertSession.computerInfo ?? null)
      .input("issueDescription", sql.NVarChar, insertSession.issueDescription ?? null)
      .query(`
        INSERT INTO support_sessions
          (id, customer_name, customer_email, language, computer_info, issue_description)
        VALUES
          (@id, @customerName, @customerEmail, @language, @computerInfo, @issueDescription)
      `);
    const session = await this.getSession(id);
    return session!;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const result = await this.pool.request()
      .input("id", sql.NVarChar, id)
      .query("SELECT * FROM support_sessions WHERE id = @id");
    if (!result.recordset[0]) return undefined;
    return rowToSession(result.recordset[0]);
  }

  async updateSession(id: string, updates: UpdateSession): Promise<Session | undefined> {
    const existing = await this.getSession(id);
    if (!existing) return undefined;

    const setClauses: string[] = ["updated_at = GETDATE()"];
    const req = this.pool.request().input("id", sql.NVarChar, id);

    if (updates.securityCode !== undefined) {
      setClauses.push("security_code = @securityCode");
      req.input("securityCode", sql.NVarChar, updates.securityCode);
    }
    if (updates.status !== undefined) {
      setClauses.push("status = @status");
      req.input("status", sql.NVarChar, updates.status);
    }
    if (updates.step1Completed !== undefined) { setClauses.push("step1_completed = @s1"); req.input("s1", sql.Bit, updates.step1Completed ? 1 : 0); }
    if (updates.step2Completed !== undefined) { setClauses.push("step2_completed = @s2"); req.input("s2", sql.Bit, updates.step2Completed ? 1 : 0); }
    if (updates.step3Completed !== undefined) { setClauses.push("step3_completed = @s3"); req.input("s3", sql.Bit, updates.step3Completed ? 1 : 0); }
    if (updates.step4Completed !== undefined) { setClauses.push("step4_completed = @s4"); req.input("s4", sql.Bit, updates.step4Completed ? 1 : 0); }
    if (updates.step5Completed !== undefined) { setClauses.push("step5_completed = @s5"); req.input("s5", sql.Bit, updates.step5Completed ? 1 : 0); }
    if (updates.step6Completed !== undefined) { setClauses.push("step6_completed = @s6"); req.input("s6", sql.Bit, updates.step6Completed ? 1 : 0); }
    if (updates.step7Completed !== undefined) { setClauses.push("step7_completed = @s7"); req.input("s7", sql.Bit, updates.step7Completed ? 1 : 0); }
    if (updates.step8Completed !== undefined) { setClauses.push("step8_completed = @s8"); req.input("s8", sql.Bit, updates.step8Completed ? 1 : 0); }

    if (setClauses.length === 1) return existing; // nothing to update

    await req.query(`UPDATE support_sessions SET ${setClauses.join(", ")} WHERE id = @id`);
    return this.getSession(id);
  }

  async getAllSessions(): Promise<Session[]> {
    const result = await this.pool.request()
      .query("SELECT * FROM support_sessions ORDER BY created_at DESC");
    return result.recordset.map(rowToSession);
  }

  async getActiveSessions(): Promise<Session[]> {
    const result = await this.pool.request()
      .query("SELECT * FROM support_sessions WHERE status != 'completed' ORDER BY updated_at DESC");
    return result.recordset.map(rowToSession);
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await this.pool.request()
      .input("id", sql.NVarChar, id)
      .query("DELETE FROM support_sessions WHERE id = @id");
    return (result.rowsAffected[0] ?? 0) > 0;
  }

  async clearAllSessions(): Promise<void> {
    await this.pool.request().query("DELETE FROM support_sessions");
  }

  // ── Statistics ────────────────────────────────────────────────────────────

  async getSessionStats(): Promise<{ total: number; active: number; completed: number; today: number }> {
    const result = await this.pool.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN CAST(created_at AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) AS today
      FROM support_sessions
    `);
    const r = result.recordset[0];
    return {
      total: r.total ?? 0,
      active: r.active ?? 0,
      completed: r.completed ?? 0,
      today: r.today ?? 0,
    };
  }

  // ── Audit log ─────────────────────────────────────────────────────────────

  async logAudit(entry: {
    adminUsername: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void> {
    const id = randomUUID();
    await this.pool.request()
      .input("id", sql.NVarChar, id)
      .input("adminUsername", sql.NVarChar, entry.adminUsername)
      .input("action", sql.NVarChar, entry.action)
      .input("targetType", sql.NVarChar, entry.targetType ?? null)
      .input("targetId", sql.NVarChar, entry.targetId ?? null)
      .input("details", sql.NVarChar, entry.details ?? null)
      .input("ipAddress", sql.NVarChar, entry.ipAddress ?? null)
      .query(`
        INSERT INTO audit_log (id, admin_username, action, target_type, target_id, details, ip_address)
        VALUES (@id, @adminUsername, @action, @targetType, @targetId, @details, @ipAddress)
      `);
  }

  async getAuditLog(limit = 100): Promise<AuditLog[]> {
    const result = await this.pool.request()
      .input("limit", sql.Int, limit)
      .query("SELECT TOP (@limit) * FROM audit_log ORDER BY created_at DESC");
    return result.recordset.map(r => ({
      id: r.id,
      adminUsername: r.admin_username,
      action: r.action,
      targetType: r.target_type ?? null,
      targetId: r.target_id ?? null,
      details: r.details ?? null,
      ipAddress: r.ip_address ?? null,
      createdAt: new Date(r.created_at),
    }));
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export async function createSqlServerStorage(): Promise<SqlServerStorage> {
  const config = getSqlConfig();
  const pool = await new sql.ConnectionPool(config).connect();
  console.log(`[SQL] Connected to SQL Server: ${config.server}/${config.database}`);

  await initializeSchema(pool);
  return new SqlServerStorage(pool);
}
