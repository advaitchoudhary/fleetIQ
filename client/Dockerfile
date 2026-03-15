# ─── FleetIQ Frontend ─────────────────────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

RUN npm install --legacy-peer-deps

# Copy source
COPY . .

EXPOSE 5173

# --host exposes Vite to all network interfaces inside the container
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
