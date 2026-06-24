# IT Support Portal — Setup & Configuration Guide

## Quick Start with Docker (recommended for Linux)

```bash
# 1. Clone / copy the project to your server
# 2. Edit docker-compose.yml — change passwords (see below)
# 3. Build and start everything
docker compose up -d --build

# Check it's running
docker compose logs -f app
```

Open **http://your-server-ip:5000** in a browser.
Admin panel is at **/admin**.

---

## What to change before going live

### 1. Passwords (docker-compose.yml)

Open `docker-compose.yml` and change **three** values:

| Variable | What it is | Change to |
|---|---|---|
| `SESSION_SECRET` | Signs login cookies | Any long random string (32+ chars) |
| `ADMIN_PASSWORD` | First-run admin password | Your secure admin password |
| `SA_PASSWORD` (×2) | SQL Server SA password | Same strong password in both places |

Generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ After you log in as admin the first time, you can change your password from the **Settings** tab inside the dashboard. Once changed, the `ADMIN_PASSWORD` env var is no longer used.

---

### 2. Admin username (docker-compose.yml)

```yaml
ADMIN_USERNAME: admin        # change to whatever you like
```

---

### 3. App port (docker-compose.yml)

```yaml
ports:
  - "80:5000"   # expose on port 80 instead of 5000
```

---

## Running WITHOUT Docker (PM2 on Linux)

```bash
# Install dependencies
npm install

# Create your environment file
cp .env.example .env
nano .env          # fill in your values

# Build the app
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save           # survive reboots
pm2 startup        # auto-start on boot (follow the printed command)
```

---

## File map — where to change things

### Branding / text

| File | What to edit |
|---|---|
| `client/src/lib/translations.ts` | ALL text shown to customers and admins (English + Hungarian) |
| `client/src/pages/Home.tsx` | Customer-facing landing page |
| `client/src/components/StatusDisplay.tsx` | The status sidebar customers see |

### Workflow steps

| File | What to edit |
|---|---|
| `client/src/lib/translations.ts` | Step titles and descriptions (search for `qaStep1`, `qaStep2` …) |
| `client/src/components/CustomerWorkflowForm.tsx` | Layout and logic of the 8-step form |
| `client/src/components/QuickAssistWorkflow.tsx` | Admin-side Quick Assist panel |

### Adding / removing workflow steps

1. Open `shared/schema.ts` — add `step9Completed` boolean column
2. Open `server/storage.ts` (MemStorage) — add `step9Completed: false` in `createSession`
3. Open `server/sqlStorage.ts` — add `step9_completed` to the SQL `CREATE TABLE` and update/select logic
4. Open `client/src/lib/translations.ts` — add `qaStep9` translations
5. Open `client/src/components/CustomerWorkflowForm.tsx` — add the new step to the `steps` array

### Authentication

| File | What to edit |
|---|---|
| `server/auth.ts` | Session cookie settings (lifetime, secure flag for HTTPS) |
| `server/storage.ts` | Default admin seeding logic |

### SQL Server connection

| File | What to edit |
|---|---|
| `docker-compose.yml` | All SQL env vars when using Docker |
| `.env` | All SQL env vars when using PM2 |
| `server/sqlStorage.ts` | `getSqlConfig()` function — advanced connection options |

### Enabling HTTPS (behind a reverse proxy)

If you put nginx or Caddy in front, set `secure: true` in the cookie settings:

```typescript
// server/auth.ts  ≈ line 61
cookie: {
  secure: true,   // ← change false to true when behind HTTPS proxy
  ...
}
```

---

## Docker commands reference

```bash
# Start everything
docker compose up -d

# Rebuild after code changes
docker compose up -d --build

# View live logs
docker compose logs -f app
docker compose logs -f sqlserver

# Stop everything
docker compose down

# Stop AND delete all data (dangerous!)
docker compose down -v

# Connect to SQL Server directly (for inspection)
docker exec -it assist-flow-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong!Passw0rd' -C
```

---

## Using Azure Data Studio / SSMS on your PC

Connect to the SQL Server running in Docker:

- **Server:** `your-server-ip,1433`
- **Authentication:** SQL Login
- **Username:** `sa`
- **Password:** your `SA_PASSWORD`
- **Trust server certificate:** checked

---

## Directory structure

```
/
├── client/src/
│   ├── components/          ← React UI components
│   │   ├── AdminDashboard.tsx      ← admin tabs (sessions, status, audit, settings)
│   │   ├── SessionManagement.tsx   ← session list and controls
│   │   ├── CustomerWorkflowForm.tsx ← 8-step customer form
│   │   └── StatusDisplay.tsx       ← customer-facing status sidebar
│   ├── pages/               ← page-level components (routes)
│   ├── lib/
│   │   └── translations.ts  ← ALL bilingual text (EN + HU)
│   └── hooks/               ← auth, status, toast hooks
│
├── server/
│   ├── index.ts             ← app entry point, rate limiting
│   ├── routes.ts            ← all API endpoints
│   ├── auth.ts              ← login / logout / password hashing
│   ├── storage.ts           ← in-memory storage + storage selector
│   ├── sqlStorage.ts        ← SQL Server storage implementation
│   └── statusManager.ts     ← technician status (in-memory, resets on restart)
│
├── shared/
│   └── schema.ts            ← data types shared by frontend and backend
│
├── Dockerfile               ← multi-stage Docker build
├── docker-compose.yml       ← app + SQL Server together
├── ecosystem.config.cjs     ← PM2 production config (non-Docker)
└── .env.example             ← environment variable template
```
