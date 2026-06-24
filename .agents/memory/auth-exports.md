---
name: Auth exports
description: What server/auth.ts exports (hashPassword and comparePasswords are both public)
---

server/auth.ts exports: hashPassword, comparePasswords, requireAuth, generateSecurityCode, setupAuth.
Both password functions are exported so routes.ts can import comparePasswords for the change-password endpoint without going through storage.
