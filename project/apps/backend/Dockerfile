# --- deps ---
    FROM node:20-bullseye-slim AS deps
    WORKDIR /app
    ENV NODE_ENV=development
    COPY package*.json ./
    RUN npm ci
    
    # --- builder ---
    FROM node:20-bullseye-slim AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    # Generate Prisma client BEFORE building so it lands in node_modules/.prisma
    RUN npx prisma generate
    # Build NestJS
    RUN npm run build
    
    # --- runner ---
    FROM node:20-bullseye-slim AS runner
    WORKDIR /app
    ENV NODE_ENV=development
    
    # Built app and generated client
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    # Include schema & migrations so we can run prisma migrate inside container
    COPY --from=builder /app/prisma ./prisma
    COPY package*.json ./
    
    EXPOSE 4000
    CMD ["node","dist/src/main.js"]
    