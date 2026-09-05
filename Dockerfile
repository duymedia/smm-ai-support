# syntax=docker/dockerfile:1
FROM node:20-slim AS builder

WORKDIR /app

# Cài đặt OpenSSL cần thiết cho Prisma Client
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt toàn bộ dependencies và generate prisma client
RUN npm install --no-audit --no-fund
RUN npx prisma generate

# Copy toàn bộ source code
COPY . .

# Build Vite frontend & Node backend bundle vào dist/
RUN npm run build

# ==================== RUNTIME STAGE ====================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt production dependencies & prisma client
RUN npm install --omit=dev --no-audit --no-fund
RUN npx prisma generate

# Copy artifact build từ builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database.sql ./database.sql

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
