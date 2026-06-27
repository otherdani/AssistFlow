# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy source
COPY . .

# Install build tools and build
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────
FROM node:20-alpine

# Create appuser (alpine doesn't have addgroup/adduser, use different syntax)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy ONLY production files from builder
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup package*.json ./

# Install ONLY production dependencies (no dev deps)
RUN npm ci --only=production && \
    npm cache clean --force

USER appuser

EXPOSE 5000

CMD ["node", "dist/server/index.mjs"]
