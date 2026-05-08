FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["./node_modules/.bin/ts-node", "--transpile-only", "-r", "tsconfig-paths/register", "src/main.ts"]
