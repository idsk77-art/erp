FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY public ./public
RUN mkdir -p data uploads
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["node", "dist/index.js"]
