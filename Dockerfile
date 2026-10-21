# Build stage: compile TypeScript and the native `canvas` dependency.
# Debian rather than Alpine because canvas needs glibc + cairo/pango to build,
# and Debian ships a packaged Stockfish.
FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ pkg-config \
      libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Runtime stage: Stockfish plus the shared libraries canvas links against.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      stockfish \
      libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    STOCKFISH_PATH=/usr/games/stockfish

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY package.json ./

ENTRYPOINT ["node", "build/index.js"]
