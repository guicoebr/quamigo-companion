# Build e runtime do +QAmigo (TanStack Start, server functions integradas — sem API separada).
# Preset nitro "node" (ver vite.config.ts) gera dist/server + dist/client como processo Node comum,
# por isso a imagem final roda em node:22-slim puro (não precisa do runtime do Bun).
#
# `bun run build` já cuida dos ajustes que o bundle do nitro precisa (NODE_ENV=production +
# patch pós-build em src/server/scripts/patch-dist.mjs — ver comentários lá e no
# docker-compose.yml). Nada a fazer aqui além disso.

FROM oven/bun:1 AS deps
WORKDIR /app
# Puppeteer's postinstall tries to download its own Chrome build during `bun install`, which
# needs `unzip` (not present in oven/bun's base image) — skip it here, the runtime stage below
# installs a real Chromium via apt and points PUPPETEER_EXECUTABLE_PATH at it instead.
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Puppeteer (geração de PDF) precisa do Chromium e suas libs de sistema.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/server ./src/server
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/package.json ./package.json
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
CMD ["./entrypoint.sh"]
