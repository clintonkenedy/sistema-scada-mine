# syntax=docker/dockerfile:1.7

# ============================================================================
# Build args para Vite (configurar en Dokploy)
# ============================================================================
# Vite hace bake-in de las VITE_* en el bundle DURANTE el build.
# Estas vars DEBEN setearse en Dokploy → Build Args, no en runtime.
#
# Variables esperadas:
#   VITE_API_URL          → URL del backend Laravel (ej: https://api.tudominio.com)
#   VITE_WS_URL           → URL del WebSocket Python (ej: wss://ws.tudominio.com)
#   VITE_MAPBOX_TOKEN     → Token público de Mapbox (pk.xxx)
# ============================================================================

# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps

WORKDIR /app

# pnpm matchea la versión local (evita errores de lockfile)
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# ---- Stage 2: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Build args — los pasa Dokploy en build time
ARG VITE_API_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8765
ARG VITE_MAPBOX_TOKEN=__PEGAR_TOKEN_AQUI__

# Vite necesita las ENV durante `pnpm run build` para hacer bake-in
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_MAPBOX_TOKEN=${VITE_MAPBOX_TOKEN}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build


# ---- Stage 3: Runtime (nginx) ----
FROM nginx:1.27-alpine AS runtime

# Instalar wget para uso externo (Dokploy/Docker healthcheck si se necesita)
RUN apk add --no-cache wget

# Eliminar config default de nginx
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copiar build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Config custom (gzip + cache + security + SPA fallback)
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# HEALTHCHECK removido — Dokploy/Traefik maneja healthcheck a nivel proxy
# La ruta /healthz sigue disponible en nginx para uso externo

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
