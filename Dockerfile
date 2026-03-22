
 
# Stage 1: build and install dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Stage 2: production-ready image
FROM node:18-alpine

WORKDIR /app

# Only copy what's needed from builder
COPY --from=builder /app /app

# Expose the port
EXPOSE 5000

# Start the server
CMD ["npm", "run", "dev"]

# Use a slim Node.js base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application files (including .env)
COPY . .

# Expose port
EXPOSE 5000

# Start the server using node
CMD ["node", "server.js"] 

