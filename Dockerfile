# ===========================
# Stage 1: Build Stage
# ===========================
FROM node:20-alpine AS build

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the NestJS project
RUN npm run build

# ===========================
# Stage 2: Production Stage
# ===========================
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built files from the build stage
COPY --from=build /usr/src/app/dist ./dist

# Expose the port NestJS app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "dist/main.js"]
