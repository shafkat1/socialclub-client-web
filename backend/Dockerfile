# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy backend package files (already in context ./backend)
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy backend source code
COPY src ./src

# Copy backend configuration files
COPY tsconfig.json ./tsconfig.json
COPY nest-cli.json ./nest-cli.json

# Copy Prisma schema for generation
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl curl

# Copy backend package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy Prisma schema and generated client from builder stage
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

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
  CMD curl -f http://localhost:3001/api/health || exit 1

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
