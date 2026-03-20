FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --legacy-peer-deps; fi

FROM node:20-alpine AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /workspace/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;'" ]
