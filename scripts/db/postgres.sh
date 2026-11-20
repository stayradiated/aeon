#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# A Docker CLI backed by Podman doesn't necessarily have a Compose provider.
DB_RUNTIME="${DB_RUNTIME:-auto}"
if [[ "$DB_RUNTIME" == auto ]]; then
  docker_path="$(command -v docker || true)"
  podman_path="$(command -v podman || true)"
  if [[ -n "$podman_path" ]] && { [[ -z "$docker_path" || "$docker_path" -ef "$podman_path" ]] || docker version 2>/dev/null | grep -qi podman; }; then
    DB_RUNTIME=podman
  else
    DB_RUNTIME=docker
  fi
fi
case "$DB_RUNTIME" in
  podman|docker) ;;
  *) echo 'DB_RUNTIME must be auto, podman, or docker' >&2; exit 1 ;;
esac

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$PROJECT_ROOT")}"
SERVICE="${SERVICE:-postgres}"
CONTAINER="${PROJECT_NAME}-${SERVICE}"
VOLUME="${PROJECT_NAME}_postgres_data"
if [[ "$DB_RUNTIME" == podman ]]; then
  # Keep native Podman and Compose from sharing a data directory.
  CONTAINER="${CONTAINER}-podman"
  VOLUME="${PROJECT_NAME}_podman_postgres_data"
fi
DB_PORT="${DB_PORT:-5432}"
if [[ "$DB_RUNTIME" == docker && -z "${COMPOSE_FILE:-}" ]]; then
  for file in docker-compose.yml compose.yml compose.yaml; do
    if [[ -f "$file" ]]; then COMPOSE_FILE="$file"; break; fi
  done
  : "${COMPOSE_FILE:?Could not find a Compose file}"
fi

compose() { docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "$@"; }
container_id() {
  if [[ "$DB_RUNTIME" == podman ]]; then
    if podman container exists "$CONTAINER"; then printf '%s\n' "$CONTAINER"; fi
  else
    compose ps -a -q "$SERVICE"
  fi
}

exec_in_db() {
  if [[ "$DB_RUNTIME" == podman ]]; then
    podman exec "$CONTAINER" "$@"
  else
    compose exec -T "$SERVICE" "$@"
  fi
}

is_running() {
  local cid
  cid="$(container_id)" || return 1
  [[ -n "$cid" && $("$DB_RUNTIME" inspect -f '{{.State.Running}}' "$cid") == true ]]
}

wait_for_db() {
  for _ in {1..60}; do
    # TCP avoids reporting ready during the image's temporary init server.
    if exec_in_db sh -c 'pg_isready -q -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' 2>/dev/null; then
      echo "PostgreSQL is ready ($DB_RUNTIME)."
      return
    fi
    is_running || break
    sleep 1
  done
  echo 'PostgreSQL did not become ready. Recent logs:' >&2
  if [[ "$DB_RUNTIME" == podman ]]; then
    podman logs --tail=80 "$CONTAINER" >&2 || true
  else
    compose logs --no-color --tail=80 "$SERVICE" >&2 || true
  fi
  return 1
}

start_postgres() {
  if [[ "$DB_RUNTIME" == podman ]]; then
    if ! podman container exists "$CONTAINER"; then
      : "${POSTGRES_DB:?Set POSTGRES_DB in .env}"
      : "${POSTGRES_USER:?Set POSTGRES_USER in .env}"
      : "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}"
      # Keep the image and data mount in sync with docker-compose.yml.
      podman create --name "$CONTAINER" --restart=unless-stopped --shm-size=128m \
        --publish "127.0.0.1:$DB_PORT:5432" \
        --env POSTGRES_DB --env POSTGRES_USER --env POSTGRES_PASSWORD \
        --volume "$VOLUME:/var/lib/postgresql" \
        docker.io/library/postgres:18.1-trixie >/dev/null
    fi
    if ! is_running; then podman start "$CONTAINER" >/dev/null; fi
  else
    compose up -d "$SERVICE"
  fi
  wait_for_db
}

stop_postgres() {
  if ! is_running; then
    echo 'PostgreSQL is not running.'
    return
  fi
  if [[ "$DB_RUNTIME" == podman ]]; then
    podman stop "$CONTAINER" >/dev/null
  else
    compose stop "$SERVICE"
  fi
  echo 'PostgreSQL stopped.'
}

destroy_postgres() {
  local cid mounted_volume reply
  cid="$(container_id)"
  if [[ -n "$cid" ]]; then
    mounted_volume="$("$DB_RUNTIME" inspect -f '{{range .Mounts}}{{if and (eq .Type "volume") (or (eq .Destination "/var/lib/postgresql") (eq .Destination "/var/lib/postgresql/data"))}}{{.Name}}{{end}}{{end}}' "$cid")"
    VOLUME="${mounted_volume:-$VOLUME}"
  fi
  read -r -p "Permanently delete PostgreSQL volume '$VOLUME'? Type yes to continue: " reply
  [[ "$reply" == yes ]] || { echo 'Cancelled.'; return 1; }
  if [[ -n "$cid" ]]; then
    stop_postgres
    if [[ "$DB_RUNTIME" == podman ]]; then
      podman rm "$CONTAINER" >/dev/null
    else
      compose rm -f "$SERVICE"
    fi
  fi
  if "$DB_RUNTIME" volume inspect "$VOLUME" >/dev/null 2>&1; then
    "$DB_RUNTIME" volume rm "$VOLUME"
  fi
}

case "${1:-}" in
  start) start_postgres ;;
  stop) stop_postgres ;;
  restart) stop_postgres; start_postgres ;;
  status)
    if is_running; then echo "PostgreSQL is running ($DB_RUNTIME)."; else echo 'PostgreSQL is not running.'; fi
    ;;
  destroy) destroy_postgres ;;
  exec) shift; exec_in_db "$@" ;;
  *) echo "Usage: $0 {start|stop|restart|status|destroy|exec COMMAND...}" >&2; exit 1 ;;
esac
