# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g vite esbuild

RUN vite build --outDir dist/public && \
    esbuild server/index.ts \
      --platform=node --packages=external --bundle --format=esm --outdir=dist/server --out-extension:.js=.mjs

# Itt MÁR NEM futtatunk npm prune-t, a builder stage-et tisztán hagyjuk a fordításra!

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-slim AS production

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Csak a package fájlokat másoljuk át a tiszta installhoz
COPY package*.json ./

# Tiszta produkciós telepítés közvetlenül a végleges környezetben
RUN npm install --omit=dev && npm cache clean --force

# Átmásoljuk a builder stage-ben lefordított dist mappát (kliens + szerver kód)
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist

# A frissen telepített node_modules és a package.json tulajdonjogát is átadjuk az appuser-nek
RUN chown -R appuser:appgroup /app/node_modules /app/package.json

USER appuser

EXPOSE 5000

CMD ["node", "dist/server/index.mjs"]
