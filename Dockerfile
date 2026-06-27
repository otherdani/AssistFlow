# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g vite esbuild

RUN vite build --outDir dist/server/public && \
    esbuild server/index.ts \
      --platform=node --packages=external --bundle --format=esm --outdir=dist/server --out-extension:.js=.mjs

# Itt MÁR NEM futtatunk npm prune-t, a builder stage-et tisztán hagyjuk a fordításra!

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-slim AS production

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy build output and installed runtime deps from builder
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/package.json ./package.json

# Defensive ownership fix
RUN chown -R appuser:appgroup /app/node_modules /app/package.json /app/dist

USER appuser

EXPOSE 5000

CMD ["node", "dist/server/index.mjs"]
