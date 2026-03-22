FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ENV DEV_CONTAINER=1
ENV NVM_DIR=/usr/local/share/nvm

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    git \
    gnupg2 \
    graphviz \
    jq \
    lsb-release \
    ripgrep \
    software-properties-common \
    sudo \
    unzip \
    vim \
    wget \
    zsh && \
    rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p "$NVM_DIR" && \
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | PROFILE=/dev/null NVM_DIR="$NVM_DIR" bash && \
    source "$NVM_DIR/nvm.sh" && \
    nvm install node && \
    nvm alias default node && \
    nvm use default && \
    npm install -g @anthropic-ai/claude-code @google/gemini-cli @openai/codex pnpm vercel && \
    NODE_BIN="$(dirname "$(nvm which current)")" && \
    ln -sf "$NODE_BIN/node" /usr/local/bin/node && \
    ln -sf "$NODE_BIN/npm" /usr/local/bin/npm && \
    ln -sf "$NODE_BIN/npx" /usr/local/bin/npx && \
    ln -sf "$NODE_BIN/pnpm" /usr/local/bin/pnpm

RUN echo 'export NVM_DIR="/usr/local/share/nvm"' >/etc/profile.d/nvm.sh && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >>/etc/profile.d/nvm.sh && \
    echo 'nvm use default >/dev/null 2>&1 || true' >>/etc/profile.d/nvm.sh && \
    chmod 644 /etc/profile.d/nvm.sh

RUN curl -fsSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list >/dev/null && \
    apt-get update && \
    apt-get install -y ngrok && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p -m 755 /etc/apt/keyrings && \
    wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null && \
    chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && \
    apt-get install -y gh && \
    rm -rf /var/lib/apt/lists/*
