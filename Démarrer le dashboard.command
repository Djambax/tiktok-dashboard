#!/bin/bash
cd "$(dirname "$0")" || exit 1

if curl -s -o /dev/null http://localhost:3000/; then
  open http://localhost:3000
  exit 0
fi

nohup npm run dev > /tmp/tiktok-dashboard.log 2>&1 &

for _ in $(seq 1 40); do
  sleep 1
  if curl -s -o /dev/null http://localhost:3000/; then
    break
  fi
done

open http://localhost:3000
