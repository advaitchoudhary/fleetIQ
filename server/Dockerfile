# ─── FleetIQ Backend ──────────────────────────────────────────────────────────
FROM node:20-alpine

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files first (layer caching — only re-installs if deps change)
COPY package*.json ./

# Install all dependencies (including devDeps for ts-node)
RUN npm install --legacy-peer-deps

# Copy the rest of the source
COPY . .

EXPOSE 8000

# Copy and set entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Use dumb-init to handle signals properly (Ctrl+C, docker stop, etc.)
ENTRYPOINT ["dumb-init", "--", "/docker-entrypoint.sh"]
