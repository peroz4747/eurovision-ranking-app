FROM node:16

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Expose port 3000 for the application (match the Vite server config)
EXPOSE 8080

# Start the Vite development server
CMD ["npx", "vite"]
