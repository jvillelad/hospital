#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "[1/3] Instalando dependencias Node..."
cd backend
npm install
echo "[2/3] Arrancando con PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi
pm2 start src/index.js --name turnos-api
pm2 save
echo "[3/3] API levantada en puerto ${PORT:-3000}"
