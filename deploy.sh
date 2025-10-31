#!/usr/bin/env bash
# Despliegue rápido en Ubuntu 22.04: API con PM2 + Nginx para frontend estático
set -e
sudo apt update
# Node y utilidades (si faltan)
if ! command -v node >/dev/null 2>&1; then
  sudo apt install -y nodejs npm
fi
# Nginx para servir frontend
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt install -y nginx
fi

# Servir frontend
FRONT_DIR="$(pwd)/frontend"
SITE="/etc/nginx/sites-available/turnos"
sudo bash -c "cat > $SITE" <<EOF
server {
    listen 80;
    server_name _;

    root ${FRONT_DIR};
    index login.html;

    location / {
        try_files $uri $uri/ /login.html;
    }
}
EOF

sudo ln -sf "$SITE" /etc/nginx/sites-enabled/turnos
sudo rm -f /etc/nginx/sites-enabled/default || true
sudo systemctl restart nginx

echo "Frontend servido por Nginx (http://<tu-ip>/)."
echo "Recuerda arrancar el backend: bash start_backend.sh"
