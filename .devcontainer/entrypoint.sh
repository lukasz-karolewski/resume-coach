#!/bin/bash
# Entrypoint script to set up docker group for the ubuntu user at container creation time
set -e

SOCK_PATH="/var/run/docker.sock"
if [ -S "$SOCK_PATH" ]; then
    SOCK_GID=$(stat -c '%g' "$SOCK_PATH")
    # Check if group with this GID exists
    EXISTING_GROUP=$(getent group "$SOCK_GID" | cut -d: -f1 2>/dev/null || true)
    if [ -n "$EXISTING_GROUP" ]; then
        usermod -aG "$EXISTING_GROUP" ubuntu
    else
        if getent group docker > /dev/null 2>&1; then
            groupmod -g "$SOCK_GID" docker
        else
            groupadd -g "$SOCK_GID" docker
        fi
        usermod -aG docker ubuntu
    fi
fi

exec "$@"
