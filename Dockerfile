# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm install -g vite esbuild

RUN vite build --outDir dist/public && \
    esbuild server/index.ts \
      --platform=node --packages=external --bundle --format=esm --outdir=dist/server --out-extension:.js=.mjs

RUN npm prune --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-slim AS production

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# A COPY és a CHOWN egyszerre történik meg, így nincs extra réteg és lemezterület-pazarlás!
COPY --chown=appuser:appgroup --from=builder /app/dist          ./dist
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/package.json ./package.json

USER appuser

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "dist/server/index.mjs"]
