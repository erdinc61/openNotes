# --- Stage 1: Dependencies ---
FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# --- Stage 2: Build ---
FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create empty DB with schema (template for first run)
RUN mkdir -p data && npx drizzle-kit push
RUN npm run build

# --- Stage 3: Production ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy DB template (used on first run when volume is empty)
COPY --from=builder /app/data/opennotes.db ./data/opennotes.db.template

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create data dir
RUN mkdir -p data
RUN chown -R nextjs:nodejs data .next

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
