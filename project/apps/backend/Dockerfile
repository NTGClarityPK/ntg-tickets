# --- deps ---
    FROM node:20-bullseye-slim AS deps
    WORKDIR /app
    ENV NODE_ENV=development
    COPY apps/backend/package*.json ./
    # Copy shared library
    COPY apps/backend/project/ntg-shared-library ./apps/backend/project/ntg-shared-library
    RUN npm ci
    
    # --- builder ---
    FROM node:20-bullseye-slim AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    # Copy shared library and build it
    COPY apps/backend/project/ntg-shared-library ./apps/backend/project/ntg-shared-library
WORKDIR /app/apps/backend/project/ntg-shared-library
RUN npm install --include=dev && npm run build
    # Copy backend source
    WORKDIR /app
    COPY apps/backend .
    # Update package.json to use correct path
    RUN sed -i 's|file:./project/ntg-shared-library|file:./apps/backend/project/ntg-shared-library|g' package.json || true
    RUN npm install
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
    