#!/usr/bin/env bash
set -e
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop turnos-api || true
  pm2 delete turnos-api || true
  pm2 save
fi
echo "Backend detenido."
