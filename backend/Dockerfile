# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy ALL essential files from backend directory
# These must exist for the build to work
COPY package*.json tsconfig.json nest-cli.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY src ./src

# Copy prisma schema if available, but don't fail if not
RUN if [ -d prisma ]; then cp -r prisma .; fi

# Generate Prisma client if schema exists
RUN npx prisma generate 2>/dev/null || true

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
