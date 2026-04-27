FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --production
EXPOSE 3006
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/data/uploads
CMD ["node", "dist/index.js"]
