# ──────────────────────────────────────────────────
# Stage 1: Build
# Compilamos TypeScript con todas las devDependencies.
# Esta imagen NO llega a producción.
# ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# npm ci garantiza instalación reproducible (usa package-lock.json exacto)
RUN npm ci

COPY . .
RUN npm run build

# ──────────────────────────────────────────────────
# Stage 2: Production
# Imagen final limpia: solo el dist compilado y
# las dependencias de producción. Sin devDeps,
# sin código fuente TypeScript, sin herramientas de build.
# Resultado: imagen ~3x más pequeña y sin superficie de ataque innecesaria.
# ──────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Usuario no-root: principio de mínimo privilegio.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
# --omit=dev instala solo las dependencias de producción
RUN npm ci --omit=dev

# Copiamos únicamente el código compilado del stage anterior
COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 3000

# node directamente como PID 1 para recibir señales del sistema correctamente
CMD ["node", "dist/main"]
