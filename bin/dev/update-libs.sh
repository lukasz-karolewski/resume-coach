#!/bin/bash

# Update all project dependencies
set -e

WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

cd "$WORKSPACE_ROOT"

(
    npm install -g pnpm vercel @anthropic-ai/claude-code @google/gemini-cli @github/copilot @openai/codex @biomejs/biome
) &
NPM_PID=$!

(cd "$WORKSPACE_ROOT" && pnpm update) &
APP_PID=$!

echo "Waiting for updates to complete..."
wait $NPM_PID && echo "✓ NPM packages updated"
wait $APP_PID && echo "✓ App dependencies updated"

echo "Migrating biome config..."
(cd "$WORKSPACE_ROOT" && biome migrate --write) && echo "✓ Biome migrated"
