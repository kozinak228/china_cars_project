# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# If you have a build step (e.g. for React/Vue), run it here:
# RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
# Install only production dependencies if needed, but for lite-server we need devDependencies or global install
# For this simple project, checking if lite-server is reachable. 
# Ideally, we should use a production-ready server like Nginx to serve static files directly, 
# but per instructions we keep Node.js container logic.
# Let's use lite-server for now as configured in package.json
EXPOSE 3000
CMD ["npm", "run", "start"]
