FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/frontend/package*.json ./
# Copy shared library
COPY apps/backend/project/ntg-shared-library ./apps/backend/project/ntg-shared-library
RUN npm ci
# Pre-install the SWC binary for Alpine (musl libc)
RUN npm install --no-save @next/swc-linux-x64-musl

FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG NODE_ENV=development
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NODE_ENV=$NODE_ENV
COPY --from=deps /app/node_modules ./node_modules
# Copy shared library and build it
COPY apps/backend/project/ntg-shared-library ./apps/backend/project/ntg-shared-library
WORKDIR /app/apps/backend/project/ntg-shared-library
RUN npm install --include=dev && npm run build
# Copy frontend source
WORKDIR /app
COPY apps/frontend .
# Update package.json to use correct path
RUN sed -i 's|file:../backend/project/ntg-shared-library|file:./apps/backend/project/ntg-shared-library|g' package.json || true
RUN npm install
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
COPY --from=builder /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm","run","start"]