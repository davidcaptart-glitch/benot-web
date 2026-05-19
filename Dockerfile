# ──────────────────────────────────────────────
#  Etapa 1: Build
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias primero (aprovecha caché de Docker)
COPY package*.json ./
RUN npm ci

# Copiar todo el código y los assets
COPY . .

# Variables de entorno públicas necesarias durante el build
# (se pasan como build-args desde docker-compose)
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Build (incluye prebuild que copia assets a public/)
RUN npm run build

# ──────────────────────────────────────────────
#  Etapa 2: Producción (imagen mínima)
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 nextjs

# Standalone bundle de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Archivos estáticos (JS/CSS chunks)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Carpeta public (incluye assets copiados por el prebuild)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Carpeta assets original (getAssetFiles la lee en tiempo de solicitud)
COPY --from=builder --chown=nextjs:nodejs /app/assets ./assets

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
