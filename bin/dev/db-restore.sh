#!/usr/bin/env bash
# Restore a custom PostgreSQL dump into local Docker Postgres or production Neon.

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./bin/dev/db-restore.sh <local|prod> <backup.dump>

The restore replaces the target public schema. Confirm by typing
"restore local" or "restore prod", or set DB_RESTORE_CONFIRM to that phrase.

Environment:
  DB_DOCKER_SERVICE=postgres
  LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resume_coach
  LOCAL_ADMIN_URL=postgresql://postgres:postgres@localhost:5432/postgres
  PROD_ENV_FILE=.env.production.local
  PROD_DATABASE_URL_UNPOOLED=<production connection string>
  NEON_PROJECT_ID=fragrant-unit-64753227
  NEON_ROLE_NAME=neondb_owner
  NEON_DATABASE_NAME=neondb
USAGE
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

env_value() {
  local file="$1"
  local key="$2"

  [[ -f "$file" ]] || return 0
  awk -F= -v key="$key" '
    $1 == key {
      value = substr($0, length(key) + 2)
      gsub(/^"|"$/, "", value)
      print value
      exit
    }
  ' "$file"
}

redact_url() {
  sed 's|://\([^:@]*\):[^@]*@|://\1:***@|' <<<"$1"
}

confirm_restore() {
  local phrase="restore $1"
  [[ "${DB_RESTORE_CONFIRM:-}" == "$phrase" ]] && return

  local confirmation
  read -rp "Type '$phrase' to continue: " confirmation
  [[ "$confirmation" == "$phrase" ]] || fail "restore aborted"
}

compose_has_pg_tools() {
  docker compose ps --status running "$DB_DOCKER_SERVICE" | grep -q "$DB_DOCKER_SERVICE" ||
    fail "Docker service '$DB_DOCKER_SERVICE' is not running. Run: docker compose up -d postgres"
  docker compose exec -T "$DB_DOCKER_SERVICE" which psql >/dev/null ||
    fail "psql not found in Docker service '$DB_DOCKER_SERVICE'."
  docker compose exec -T "$DB_DOCKER_SERVICE" which pg_restore >/dev/null ||
    fail "pg_restore not found in Docker service '$DB_DOCKER_SERVICE'."
}

prod_url() {
  if [[ -n "${PROD_DATABASE_URL_UNPOOLED:-}" ]]; then
    echo "$PROD_DATABASE_URL_UNPOOLED"
    return
  fi

  local url
  url="$(env_value "$PROD_ENV_FILE" DATABASE_URL_UNPOOLED)"
  [[ -n "$url" ]] && echo "$url" && return

  npx -y neonctl connection-string main \
    --project-id "$NEON_PROJECT_ID" \
    --role-name "$NEON_ROLE_NAME" \
    --database-name "$NEON_DATABASE_NAME" \
    --ssl require
}

verify_counts() {
  local target_url="$1"
  docker compose exec -T -e TARGET_URL="$target_url" "$DB_DOCKER_SERVICE" sh -lc \
    'psql "$TARGET_URL" -v ON_ERROR_STOP=1 -P pager=off -c '\''
      SELECT
        (SELECT count(*) FROM public."user") AS users,
        (SELECT count(*) FROM public."Resume") AS resumes,
        (SELECT count(*) FROM public."Job") AS jobs,
        (SELECT count(*) FROM public."session") AS sessions,
        (SELECT count(*) FROM public.chat_threads) AS chat_threads;
    '\'''
}

TARGET="${1:-}"
BACKUP_FILE="${2:-}"
if [[ "$TARGET" == "-h" || "$TARGET" == "--help" ]]; then
  usage
  exit 0
fi
[[ "$TARGET" == "local" || "$TARGET" == "prod" ]] ||
  fail "target must be 'local' or 'prod'. See --help."
[[ -n "$BACKUP_FILE" ]] || fail "backup file is required. See --help."
[[ -f "$BACKUP_FILE" ]] || fail "backup file not found: $BACKUP_FILE"
[[ "$(head -c 5 "$BACKUP_FILE")" == "PGDMP" ]] ||
  fail "backup must be a PostgreSQL custom-format dump created by db-backup.sh"

DB_DOCKER_SERVICE="${DB_DOCKER_SERVICE:-postgres}"
PROD_ENV_FILE="${PROD_ENV_FILE:-.env.production.local}"
NEON_PROJECT_ID="${NEON_PROJECT_ID:-fragrant-unit-64753227}"
NEON_ROLE_NAME="${NEON_ROLE_NAME:-neondb_owner}"
NEON_DATABASE_NAME="${NEON_DATABASE_NAME:-neondb}"
LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/resume_coach}"
LOCAL_ADMIN_URL="${LOCAL_ADMIN_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"
compose_has_pg_tools

if [[ "$TARGET" == "prod" ]]; then
  TARGET_URL="$(prod_url)"
else
  TARGET_URL="$LOCAL_DATABASE_URL"
fi

echo "Restoring to $TARGET"
echo "Backup: $BACKUP_FILE"
echo "Target: $(redact_url "$TARGET_URL")"
confirm_restore "$TARGET"

if [[ "$TARGET" == "local" ]]; then
  docker compose exec -T -e ADMIN_URL="$LOCAL_ADMIN_URL" "$DB_DOCKER_SERVICE" sh -lc \
    'psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c '\''DROP DATABASE IF EXISTS resume_coach WITH (FORCE);'\'''
  docker compose exec -T -e ADMIN_URL="$LOCAL_ADMIN_URL" "$DB_DOCKER_SERVICE" sh -lc \
    'psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c '\''CREATE DATABASE resume_coach;'\'''
else
  docker compose exec -T -e TARGET_URL="$TARGET_URL" "$DB_DOCKER_SERVICE" sh -lc \
    'psql "$TARGET_URL" -v ON_ERROR_STOP=1 -c '\''DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'\'''
fi

docker compose exec -T -e TARGET_URL="$TARGET_URL" "$DB_DOCKER_SERVICE" sh -lc \
  'pg_restore --exit-on-error --clean --if-exists --no-owner --no-acl --no-comments -d "$TARGET_URL"' \
  < "$BACKUP_FILE"

echo "Restore complete. Verifying row counts..."
verify_counts "$TARGET_URL"
