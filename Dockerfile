# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Itt sima installt használunk, kellenek a dev csomagok a buildhez!
RUN npm install

COPY . .

# Lefordítjuk a kódot (Vite, esbuild)
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────
FROM node:20-alpine

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# A chown itt tökéletes, nem csinál felesleges extra réteget!
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup package*.json ./

# Itt is sima installt használunk, de itt már szigorúan kihagyjuk a dev csomagokat
RUN npm install --omit=dev && \
    npm cache clean --force

USER appuser

EXPOSE 5000

CMD ["node", "dist/server/index.mjs"]
