FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Cài đặt OpenSSL cho Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package và schema prisma
COPY package*.json ./
COPY prisma ./prisma/

# Cài dependencies và tạo Prisma Client
RUN npm install --no-audit --no-fund
RUN npx prisma generate

# Copy mã nguồn và build
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/server.cjs"]
