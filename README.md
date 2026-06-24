# IT Support Portal - Deployment Guide

This application is a single-admin IT support web application featuring a Microsoft Quick Assist workflow, bilingual support (English/Hungarian), and secure session management.

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Nginx**: For production deployment (reverse proxy & SSL)

## Local Setup

1. **Extract the ZIP file** to your desired directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory, clone the .env.example file

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
1. **Build the application**:
   ```bash
   npm run build
   ```
2. **Start the server**:
   ```bash
   npm run start
   ```

## Production Deployment with Nginx

To run this securely in a production environment, you should use Nginx as a reverse proxy. This handles SSL termination and provides better performance.

### Example Nginx Configuration

Create a file at `/etc/nginx/sites-available/it-support` (or equivalent):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Key Security Notes

- **SSL**: Always use HTTPS in production. The application is configured to use secure cookies when `NODE_ENV=production`.
- **Rate Limiting**: The application has built-in rate limiting for `/api/login` and `/api/sessions/:id/security-code`.
- **Secrets**: Never commit your `.env` file to version control.
- **Process Manager**: It is recommended to use `pm2` to keep the application running:
  ```bash
  npm install -g pm2
  pm2 start dist/index.js --name "it-support"
  ```
