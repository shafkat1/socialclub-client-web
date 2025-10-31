# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy ONLY package files (guaranteed to exist)
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY src ./src

# Build application (NestJS will work even without tsconfig if src is present)
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
