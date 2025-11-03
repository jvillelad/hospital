# Sistema Visual de Cola de Turnos para Pacientes

Proyecto universitario: Backend Node.js + Express + JWT, Frontend HTML/CSS/JS, BD SQL Server.

## Estructura
- backend/: API REST, JWT, rutas de triaje/turnos/clinicas/pacientes.
- frontend/: Pantallas (login, triaje, dashboard médico, display).
- db.sql: Script SQL Server (tablas + datos de ejemplo).
- .env.example: Variables de entorno.
- deploy.sh: Instalación nativa en Ubuntu 22.04 + PM2 + Nginx estático.
- start_backend.sh / stop_backend.sh: Scripts de ejecución con PM2.

## Pasos rápidos (Ubuntu 22.04)
```bash
unzip hospital-turnos.zip -d ~/ && cd ~/hospital-turnos
cp backend/.env.example backend/.env
# Edita backend/.env con tus valores de SQL Server
cd backend && npm install && cd ..
bash start_backend.sh
# (opcional) sirves frontend con Nginx: sudo bash deploy.sh
```

URLs por defecto (localhost):
- API: http://localhost:3000
- Frontend: abre `frontend/login.html` o servir con Nginx en http://localhost

Credenciales demo:
- admin@hospital.com / password
