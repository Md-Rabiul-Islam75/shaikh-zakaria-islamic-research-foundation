# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────
# Stage 1 — deps: install npm packages only
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ─────────────────────────────────────────────────────────────
# Stage 2 — builder: generate Prisma client + build Next.js
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Tell Next.js we are doing a production build
ENV NEXT_TELEMETRY_DISABLED=1

# Build script runs:  prisma generate && prisma migrate deploy && next build
# We skip migrate deploy at build time (no DB available) — migrations will run
# on container START via the entrypoint.
RUN npx prisma generate
RUN npx next build

# ─────────────────────────────────────────────────────────────
# Stage 3 — runner: minimal image to run the app
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy standalone server (Next.js minimal output)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma needs the schema + migrations + generated client at runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy full node_modules so Prisma 7 CLI symlinks + WASM files stay intact.
# (Granular copying breaks Prisma 7's bundled CLI which references WASM files
# relative to its own location.)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Entrypoint runs migrations then starts server
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
