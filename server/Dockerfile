FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# .dockerignore keeps .env and node_modules out — secrets come from the
# runtime environment, never from the image.
COPY . .

USER node

EXPOSE 4000

CMD ["node", "index.js"]
