---
name: SQL Server storage pattern
description: How the dual-storage (MemStorage/SqlServerStorage) system works and how to extend it
---

The app supports two storage backends, chosen at runtime:
- If SQL_SERVER and SQL_DATABASE env vars are set → SqlServerStorage (server/sqlStorage.ts)
- Otherwise → MemStorage (server/storage.ts)

**How:** `initStorage()` in server/storage.ts picks the backend and sets a module-level singleton. A Proxy on the legacy `storage` export forwards calls to the singleton. Routes that need SQL-only features (audit log, user management, stats) call `getSqlStorage()` which dynamically imports and casts.

**Why:** Allows the app to work out of the box in dev/demo without SQL Server, while seamlessly upgrading to persistent storage in production.

**How to apply:** When adding new storage methods, add them to IStorage (if cross-backend) or to ISqlStorage in sqlStorage.ts (if SQL-only), and wrap the route with `getSqlStorage()` returning a graceful fallback for non-SQL mode.

Tables auto-created on first connect: users, support_sessions, audit_log.
