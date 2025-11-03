module.exports = {
  apps: [
    {
      name: "turnos-api",
      script: "src/index.js",
      cwd: "/home/rdiaz/hospital-turnos/backend",
      interpreter: "node",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DB_USER: "sa",
        DB_PASS: "Password123*",
        DB_SERVER: "89.38.131.107",
        DB_NAME: "ColaHospital",
        DB_ENCRYPT: "false",
        DB_TRUST_CERT: "true",
        JWT_SECRET: "supersecret123",
        CORS_ORIGIN: "*"
      }
    }
  ]
};
