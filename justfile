# Justfile for Rough.app
# Provide access to local Node module binaries, and makes just recipe commands
# behave more like script entries in Node.js package.json files:

export PATH := "./node_modules/.bin:" + env_var('PATH')

# Load environment variables from .env file

set dotenv-load := true

# Modules

mod dev
mod db

# Default recipe (shows help)
default:
    @just --list --list-submodules

# Update all dependencies
update:
    pnpm update --recursive --latest

# Install dependencies
install:
    @echo "Installing dependencies..."
    pnpm install

# Sync SvelteKit files (public command for CI)
svelte-sync:
    svelte-kit sync

# Production build
build: svelte-sync
    vite build

# Preview production build
preview:
    vite preview

# TypeScript + Svelte checking
check *args: svelte-sync
    svelte-check --tsconfig ./tsconfig.json {{ args }}

# Check code style with ESLint
fix:
    ./scripts/biome check --unsafe --write --colors=force .
    eslint --fix .
    just --unstable --fmt

lint:
    ./scripts/biome check --unsafe --colors=force .
    eslint .

# Find unused files and code
knip: svelte-sync
    knip

test *args:
    vitest {{ args }}

test-coverage:
    vitest --run --coverage
