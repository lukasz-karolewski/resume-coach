#!/bin/bash
VOLUME_NAME=miktex

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <tex filename>"
    exit 1
fi

if ! [[ $(docker volume ls --filter=name=$VOLUME_NAME --format='{{.Name}}') ]]; then 
  echo "$VOLUME_NAME not found, creating"
  docker volume create --name $VOLUME_NAME
fi

docker run -it --rm \
  -v miktex:/miktex/.miktex \
  -v `pwd`:/miktex/work \
  miktex/miktex \
  pdflatex $1

rm *.log *.aux *.out
