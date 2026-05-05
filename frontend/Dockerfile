FROM node:20-alpine AS builder

WORKDIR /app

# Copy lock file so npm ci uses exact pinned versions
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Unprivileged nginx — runs as nginx user on port 8080 (no root needed)
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
