#!/usr/bin/env sh

set -eux

# run database migrations
pnpm exec graphile-migrate migrate --config ./gmrc.cjs

exec node ./prod-server.js
