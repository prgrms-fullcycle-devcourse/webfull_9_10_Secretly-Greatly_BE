#!/bin/bash
set -e

cd /home/ubuntu/webfull_9_10_Secretly-Greatly_BE

git pull origin main

docker compose up -d --build

docker compose exec -T backend npx prisma migrate deploy

docker image prune -f