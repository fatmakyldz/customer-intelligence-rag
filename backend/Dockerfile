FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Compile, then drop dev dependencies to keep the image small.
RUN npx tsc -p tsconfig.json && npm prune --omit=dev

# Download the embedding model at build time so the first request doesn't wait for it
# and the container never needs to reach huggingface.co at runtime.
RUN node -e "import('@xenova/transformers').then(({ pipeline }) => pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')).then(() => console.log('model cached'))"

# Hugging Face Spaces runs containers as uid 1000 (the "node" user in this image).
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/main.js"]
