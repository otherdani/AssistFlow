module.exports = {
  apps: [{
    name: "assist-flow",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000,

      // Session secret — CHANGE THIS to a long random string in production
      // Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
      SESSION_SECRET: "change-this-to-a-long-random-secret",

      // Default admin credentials (used only on first startup if no admin exists)
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "change-this-password",

      // ── SQL Server ────────────────────────────────────────────────────────
      // Remove or leave blank to use in-memory storage (data lost on restart)
      // SQL_SERVER: "localhost",
      // SQL_PORT: "1433",
      // SQL_DATABASE: "ITSupport",
      // SQL_USER: "sa",
      // SQL_PASSWORD: "your-password",
      // SQL_ENCRYPT: "false",
      // SQL_TRUST_CERT: "true",
    }
  }]
}
