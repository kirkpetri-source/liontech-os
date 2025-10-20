# Multi-purpose Dockerfile for production runtime
# Base image with Debian (bookworm) to have required libs for Chromium
FROM node:20-bookworm-slim

# Install system dependencies required by Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
  ca-certificates \
  curl \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxshmfence1 \
  libxss1 \
  xdg-utils \
  wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for better caching
COPY package.json package-lock.json* ./

# Install deps (this will also download Chromium via Puppeteer postinstall)
RUN npm ci

# Generate Prisma client if used
RUN npx prisma generate || true

# Copy source code
COPY . .

# Build Next.js in production mode
ENV NODE_ENV=production
RUN npm run build

# Expose default port
EXPOSE 3000

# Runtime environment defaults
ENV PORT=3000 \
    HOST=0.0.0.0 \
    WA_HEADLESS=true

# Start the custom Next.js server
CMD ["npm", "run", "start"]