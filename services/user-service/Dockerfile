FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

    # Install all dependencies (including dev for build)
    # NOTE: repo may not include package-lock.json, so use npm install (not npm ci)
    RUN npm install

    # Copy source code
    COPY . .

    # Build TypeScript
    RUN npm run build

    # Remove dev dependencies after build
    RUN npm prune --production

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]

