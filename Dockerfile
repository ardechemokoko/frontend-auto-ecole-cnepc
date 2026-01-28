# ===== STAGE 1: Build =====
FROM node:22.14.0 AS build

ENV HOST='0.0.0.0'
ENV PORT='3000'

WORKDIR /app

# Activer corepack pour pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copier les fichiers de dépendances pour optimiser le cache
COPY package.json pnpm-lock.yaml* ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le reste du code
COPY . .

# Build production
RUN pnpm run build

# ===== STAGE 2: Nginx =====
FROM nginx:alpine

# Lier le package GHCR au repo GitHub (très important pour éviter le 403)
LABEL org.opencontainers.image.source="https://github.com/ardechemokoko/frontend-auto-ecole-cnepc"

# Copier le build depuis le stage précédent
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la config Nginx (ou utiliser celle par défaut)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
