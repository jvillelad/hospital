# Sistema Visual de Cola de Turnos para Pacientes
## Estructura
- backend/: API REST, JWT, rutas de triaje/turnos/clinicas/pacientes.
- frontend/: Pantallas (login, triaje, dashboard médico, display).
- db.sql: Script SQL Server (tablas + datos de ejemplo).
- .env.example: Variables de entorno.
- deploy.sh: Instalación nativa en Ubuntu 22.04 + PM2
- start_backend.sh / stop_backend.sh: Scripts de ejecución con PM2.

## Pasos rápidos (Ubuntu 22.04)
```bash
unzip hospital.zip -d ~/ && cd ~/hospital
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores de SQL Server
cd backend && npm install && cd ..
bash start_backend.sh
# (opcional) sirves frontend con Nginx: sudo bash deploy.sh
```

URLs por defecto (localhost):
- API: http://localhost:3000
- Frontend: abre `frontend/login.html` o servir con Nginx en http://localhost
