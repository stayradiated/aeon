# Aeon

## Local development

Install the Node.js version in `.node-version`, pnpm, `just`, and either Podman or Docker with the Compose plugin.

```sh
cp .env.example .env  # first setup only; keep any existing .env
pnpm install --frozen-lockfile
just db start
just db migrate
just dev start
```

The development server defaults to <http://localhost:5173>. Use `just dev logs` to see its output.

`just db start` uses native Podman when `docker` is a Podman shim or Docker is absent. No Compose provider is needed in that mode. Set `DB_RUNTIME=podman` or `DB_RUNTIME=docker` to select a runtime explicitly. Native Podman keeps its own named data volume; switching runtimes does not migrate your existing data.

PostgreSQL listens on `127.0.0.1:5432` by default. If another container uses that port, set `DB_PORT` and update the database URLs in `.env` before creating the container. `POSTGRES_DB` only takes effect on a new volume. If an existing volume is missing `aeon`, create it without resetting the volume:

```sh
./scripts/db/postgres.sh exec sh -c 'createdb -U "$POSTGRES_USER" aeon'
just db migrate
```

## Checks and builds

```sh
just check
just lint
just test --run
just build
```
