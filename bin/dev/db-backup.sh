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
  PROD_URL_KEY=POSTGRES_URL_NON_POOLING
  PROD_DATABASE_URL_UNPOOLED=<production connection string>

The prod target reads exactly one key, PROD_URL_KEY, from PROD_ENV_FILE, unless
PROD_DATABASE_URL_UNPOOLED is set. It never falls back to another key, and it
refuses to run if the result points at a local database.
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

is_local_url() {
  [[ "$1" =~ @(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])([:/]|$) ]]
}

prod_url() {
  if [[ -n "${PROD_DATABASE_URL_UNPOOLED:-}" ]]; then
    echo "$PROD_DATABASE_URL_UNPOOLED"
    return
  fi

  env_value "$PROD_ENV_FILE" "$PROD_URL_KEY"
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
PROD_URL_KEY="${PROD_URL_KEY:-POSTGRES_URL_NON_POOLING}"
LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/resume_coach}"
OUTPUT="${2:-}"

if [[ -z "$OUTPUT" ]]; then
  mkdir -p backup
  OUTPUT="backup/resume-coach-${TARGET}-$(date +%Y%m%d-%H%M%S).dump"
fi
mkdir -p "$(dirname "$OUTPUT")"
compose_has_pg_dump

if [[ "$TARGET" == "prod" ]]; then
  if [[ -n "${PROD_DATABASE_URL_UNPOOLED:-}" ]]; then
    PROD_URL_SOURCE="PROD_DATABASE_URL_UNPOOLED"
  else
    PROD_URL_SOURCE="$PROD_URL_KEY in $PROD_ENV_FILE"
  fi

  DB_URL="$(prod_url)"
  [[ -n "$DB_URL" ]] ||
    fail "$PROD_URL_SOURCE is empty. Set it, or pass PROD_DATABASE_URL_UNPOOLED."
  if is_local_url "$DB_URL"; then
    fail "'prod' resolved to a local database via $PROD_URL_SOURCE. Point it at production."
  fi
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
