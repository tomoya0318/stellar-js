# Stellar-JS: GitHub Repository Mining Tool
# Multi-stage build for optimized production container

# Development/Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S stellar -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=stellar:nodejs . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/exports /app/config \
    && chown -R stellar:nodejs /app/data /app/logs /app/exports /app/config

# Create volume mount points
VOLUME ["/app/data", "/app/logs", "/app/exports", "/app/config"]

# Switch to non-root user
USER stellar

# Expose port (if needed for monitoring)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node --version || exit 1

# Default command
CMD ["npm", "run", "large-scale-collection"]