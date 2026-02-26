# ──────────────────────────────────────────────────
# Stage 1: Build
# Compilamos la aplicación Angular en modo producción.
# Esta imagen NO llega al servidor final.
# ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# npm ci garantiza instalación reproducible y más rápida que npm install
RUN npm ci

COPY . .
RUN npm run build

# ──────────────────────────────────────────────────
# Stage 2: Production (nginx)
# Solo copiamos los estáticos compilados + config nginx.
# Sin Node.js, sin código fuente, sin devDependencies.
# ──────────────────────────────────────────────────
FROM nginx:alpine AS production

# Eliminamos la config por defecto de nginx
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/voley-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
