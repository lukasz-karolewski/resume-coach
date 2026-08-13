#!/usr/bin/env bash
# Back up local Docker Postgres or production Neon as a custom-format dump.

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./bin/dev/db-backup.sh <local|prod> [output.dump]

Defaults:
  local -> ./backup/resume-coach-local-YYYYMMDD-HHMMSS.dump
  prod  -> ./backup/resume-coach-prod-YYYYMMDD-HHMMSS.dump

Environment:
  DB_DOCKER_SERVICE=postgres
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

compose_has_pg_dump() {
  docker compose ps --status running "$DB_DOCKER_SERVICE" | grep -q "$DB_DOCKER_SERVICE" ||
    fail "Docker service '$DB_DOCKER_SERVICE' is not running. Run: docker compose up -d postgres"
  docker compose exec -T "$DB_DOCKER_SERVICE" which pg_dump >/dev/null ||
    fail "pg_dump not found in Docker service '$DB_DOCKER_SERVICE'."
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

TARGET="${1:-}"
if [[ "$TARGET" == "-h" || "$TARGET" == "--help" ]]; then
  usage
  exit 0
fi
[[ "$TARGET" == "local" || "$TARGET" == "prod" ]] ||
  fail "target must be 'local' or 'prod'. See --help."

DB_DOCKER_SERVICE="${DB_DOCKER_SERVICE:-postgres}"
PROD_ENV_FILE="${PROD_ENV_FILE:-.env.production.local}"
NEON_PROJECT_ID="${NEON_PROJECT_ID:-fragrant-unit-64753227}"
NEON_ROLE_NAME="${NEON_ROLE_NAME:-neondb_owner}"
NEON_DATABASE_NAME="${NEON_DATABASE_NAME:-neondb}"
LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/resume_coach}"
OUTPUT="${2:-}"

if [[ -z "$OUTPUT" ]]; then
  mkdir -p backup
  OUTPUT="backup/resume-coach-${TARGET}-$(date +%Y%m%d-%H%M%S).dump"
fi
mkdir -p "$(dirname "$OUTPUT")"
compose_has_pg_dump

if [[ "$TARGET" == "prod" ]]; then
  DB_URL="$(prod_url)"
else
  DB_URL="$LOCAL_DATABASE_URL"
fi

echo "Backing up $TARGET database"
echo "Source: $(redact_url "$DB_URL")"
echo "Output: $OUTPUT"

docker compose exec -T -e TARGET_URL="$DB_URL" "$DB_DOCKER_SERVICE" \
  sh -lc 'pg_dump "$TARGET_URL" --schema=public --no-owner --no-acl -Fc' > "$OUTPUT"

BYTES="$(wc -c < "$OUTPUT")"
[[ "$BYTES" -gt 1000 ]] || fail "backup is unexpectedly small: $BYTES bytes"
echo "Done. $(du -h "$OUTPUT" | awk '{print $1}') written."
