# ------------------------------------------------------------------------------
# Stage 1: Build stage
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native compilation toolchain (python, make, g++) for argon2 and better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests and tsconfig
COPY package.json package-lock.json tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Prune devDependencies so only production node_modules remain
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Production runtime stage
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install runtime utilities for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package.json package-lock.json ./

# Install tsx globally for stage 3 decorators & ESM imports execution
RUN npm install -g tsx && npm cache clean --force

# Copy pre-compiled production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled files and source metadata
COPY --from=builder /app/build ./build
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy storage directory for SQLite persistence
COPY src/storage ./src/storage

# Setup non-root user
RUN groupadd -r proxyguard && useradd -r -g proxyguard -d /app proxyguard \
    && chown -R proxyguard:proxyguard /app

USER proxyguard

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:3000/health || exit 1

CMD ["tsx", "src/main.ts"]
