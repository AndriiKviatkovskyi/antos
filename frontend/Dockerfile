# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest
COPY . .

EXPOSE 5173

# Vite needs --host inside Docker
CMD ["npm", "run", "dev", "--", "--host"]
