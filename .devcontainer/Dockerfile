FROM ubuntu:24.04

ENV DEV_CONTAINER=1
ENV NVM_DIR=/home/ubuntu/.nvm
ENV BASH_ENV=/home/ubuntu/.bash_env
ENV ZSH=/home/ubuntu/.oh-my-zsh

# Update package lists and install essential dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    lsb-release \
    sudo \
    git \
    zsh \
    vim \
    unzip \
    ripgrep \
    lsof \
    build-essential \
    make \
    g++ \
    iputils-ping \
    dnsutils \
    net-tools \
    netcat-openbsd \
    traceroute \
    tcpdump \
    iproute2 \
    jq

# Install Oh My Zsh for the ubuntu user and make zsh the default shell.
RUN chsh -s /usr/bin/zsh ubuntu && \
    su - ubuntu -c "RUNZSH=no CHSH=no KEEP_ZSHRC=no ZSH='$ZSH' sh -c \"\$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)\""

# Install Node.js via nvm (official install method)
ARG NODE_VERSION=node
RUN NVM_VERSION="$(curl -fsSL https://api.github.com/repos/nvm-sh/nvm/releases/latest | jq -r '.tag_name')" && \
    su - ubuntu -c "PROFILE='$BASH_ENV' bash -lc 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash'" && \
    su - ubuntu -c "printf '%s\n' 'export NVM_DIR=\"/home/ubuntu/.nvm\"' '[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"' 'nvm use --silent default >/dev/null 2>&1 || true' > '$BASH_ENV'" && \
    su - ubuntu -c "grep -qxF '. \"$BASH_ENV\"' /home/ubuntu/.bashrc || printf '\n. \"$BASH_ENV\"\n' >> /home/ubuntu/.bashrc" && \
    su - ubuntu -c "grep -qxF '. \"$BASH_ENV\"' /home/ubuntu/.zshrc || printf '\n. \"$BASH_ENV\"\n' >> /home/ubuntu/.zshrc" && \
    su - ubuntu -c "bash -lc 'source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm alias default $NODE_VERSION && nvm use default && npm install -g npm@latest'"

# Install latest Docker
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# dive to inspect docker images
RUN DIVE_VERSION=$(curl -sL "https://api.github.com/repos/wagoodman/dive/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/') && \
    curl -OL https://github.com/wagoodman/dive/releases/download/v${DIVE_VERSION}/dive_${DIVE_VERSION}_linux_$(dpkg --print-architecture).deb && \
    sudo apt-get install -y ./dive_${DIVE_VERSION}_linux_$(dpkg --print-architecture).deb && \
    rm -f ./dive_${DIVE_VERSION}_linux_$(dpkg --print-architecture).deb

# GitHub CLI
RUN mkdir -p -m 755 /etc/apt/keyrings && \
    out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg && \
    cat $out | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null && \
    chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh

# set up sudo
RUN echo "ubuntu ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/ubuntu

# Copy entrypoint script for docker group setup
COPY .devcontainer/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
