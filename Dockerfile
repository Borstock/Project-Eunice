# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy application source code
COPY . .

# Build arguments for Vite environment configuration (optional)
ARG VITE_APP_NAME
ARG VITE_STORAGE_PREFIX
ARG VITE_ENABLE_DEBUG
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_STORAGE_PREFIX=$VITE_STORAGE_PREFIX
ENV VITE_ENABLE_DEBUG=$VITE_ENABLE_DEBUG
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build production bundle
RUN pnpm run build

# Stage 2: Serve stage with Nginx
FROM nginx:alpine AS runner

# Copy customized Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
