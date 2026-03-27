#syntax=docker/dockerfile:1.4

# --- Base Stage ---
FROM node:25.8.2-alpine@sha256:cf38e1f3c28ac9d81cdc0c51d8220320b3b618780e44ef96a39f76f7dbfef023 AS base
WORKDIR /app
RUN npm install --global pnpm

# --- Builder Stage ---
FROM base AS builder

# Install just from Alpine packages
RUN apk add --no-cache just

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

COPY . ./

# Inject the PUBLIC_APP_VERSION env var
ARG APP_VERSION=v0.0.0
ENV PUBLIC_APP_VERSION=$APP_VERSION

# build the application
RUN NODE_OPTIONS=--max_old_space_size=4096 just build

RUN find build -type f -name '*.map' -delete

# --- Runner Stage ---
FROM base AS runner
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/build /app/build/
COPY migrations /app/migrations/
COPY docker-app-start.sh prod-server.js gmrc.cjs /app/
WORKDIR /app
EXPOSE 3000
CMD ["./docker-app-start.sh"]
