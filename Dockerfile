# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files and TypeScript config first for better layer caching
COPY package*.json tsconfig*.json nest-cli.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies for production image
RUN npm prune --production

# Change ownership of the app directory to nodejs user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Set default environment variables for container startup
# These can be overridden by docker-compose or environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Database URLs will be set by docker-compose or environment
ENV JWT_SECRET=your-docker-jwt-secret-change-in-production
ENV JWT_EXPIRATION=24h
ENV FRONTEND_URL=http://localhost:3000
ENV OFFICE_LOCATION_RADIUS=100

# Start the application
CMD ["npm", "run", "start:prod"]
