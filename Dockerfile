FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm i

# Bundle app source
COPY . .

# Build the TypeScript files
RUN npm run build

# Start the app
CMD ["npm", "run", "start"]
