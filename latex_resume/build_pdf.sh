#!/bin/bash
VOLUME_NAME=miktex

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <tex filename>"
    exit 1
fi

if ! [[ $(docker volume ls --filter=name=$VOLUME_NAME --format='{{.Name}}') ]]; then 
  echo "volume $VOLUME_NAME not found, creating"
  docker volume create --name $VOLUME_NAME
fi

# miktex/miktex needs to be build manually from git@github.com:MiKTeX/docker-miktex.git, using docker build --tag miktex/miktex .
docker run -it --rm \
  -v miktex:/miktex/.miktex \
  -v "$(pwd)":/miktex/work \
  -e MIKTEX_GID="$(id -g)" \
  -e MIKTEX_UID="$(id -u)" \
  miktex/miktex \
  pdflatex "$1"

rm ./*.log ./*.aux ./*.out
