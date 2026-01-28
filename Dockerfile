FROM node:22.14.0

ENV HOST='0.0.0.0'
ENV PORT='3000'

WORKDIR /app

# Activer corepack pour utiliser  ok pnpm (intégré à Node.js, évite les problèmes SSL avec npm)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copier les fichiers de dépendances d'abord pour optimiser le cache Docker
COPY package.json pnpm-lock.yaml* ./

# Installer les dépendances avec pnpm
RUN pnpm install --frozen-lockfile

# Copier le reste des fichiers
COPY . .

EXPOSE 3000

CMD [ "pnpm", "run", "dev" ]
