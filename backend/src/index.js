// ===============================
// Sistema Visual de Cola de Turnos
// Backend + Frontend unificado
// ===============================

import express from "express";
import cors from "cors";
import mssql from "mssql";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// Conexión a SQL Server
// ===============================
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let pool;
async function conectarDB() {
  try {
    pool = await mssql.connect(dbConfig);
    console.log("✅ Conectado a SQL Server");
  } catch (err) {
    console.error("❌ Error de conexión SQL:", err);
  }
}
await conectarDB();

// ===============================
// Middleware de autenticación JWT
// ===============================
function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ msg: "Token faltante" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ msg: "Token inválido" });
  }
}

// ===============================
// Rutas API
// ===============================
app.get("/", (req, res) => res.json({ ok: true, name: "Hospital Turnos API" }));

// LOGIN
app.post("/api/login", async (req, res) => {
  const { correo, password } = req.body;
  try {
    const result = await pool
      .request()
      .input("correo", mssql.VarChar, correo)
      .input("password", mssql.VarChar, password)
      .query("SELECT * FROM Usuarios WHERE correo=@correo AND password=@password");

    if (result.recordset.length === 0)
      return res.status(401).json({ message: "Login inválido" });

    const user = result.recordset[0];
    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en servidor" });
  }
});

// CLINICAS
app.get("/api/clinicas", auth, async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM Clinicas");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Error al consultar clínicas" });
  }
});

// PACIENTES
app.get("/api/pacientes", auth, async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM Pacientes");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Error al consultar pacientes" });
  }
});

app.post("/api/pacientes", auth, async (req, res) => {
  const { nombre, edad, sintomas } = req.body;
  if (!nombre || !edad || !sintomas)
    return res.status(400).json({ message: "Datos incompletos" });

  try {
    await pool
      .request()
      .input("nombre", mssql.VarChar, nombre)
      .input("edad", mssql.Int, edad)
      .input("sintomas", mssql.VarChar, sintomas)
      .input("estado", mssql.VarChar, "Registrado")
      .query("INSERT INTO Pacientes (nombre, edad, sintomas, estado) VALUES (@nombre, @edad, @sintomas, @estado)");
    res.json({ message: "Paciente registrado correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar paciente:", err);
    res.status(500).json({ message: "Error al registrar paciente" });
  }
});

// ===============================
// CREAR NUEVO TURNO (desde Triaje)
// ===============================
app.post('/api/turnos', auth, async (req, res) => {
  try {
    // Log de depuración
    console.log('🟦 POST /api/turnos body:', req.body);
    const { paciente_id, clinica_id } = req.body;

    if (!paciente_id || !clinica_id) {
      console.warn('⚠️ Datos incompletos:', req.body);
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Validar existencia (opcional pero útil para mensajes claros)
    const [pacienteQ, clinicaQ] = await Promise.all([
      pool.request().input('pid', mssql.Int, paciente_id).query('SELECT id FROM Pacientes WHERE id=@pid'),
      pool.request().input('cid', mssql.Int, clinica_id).query('SELECT id FROM Clinicas WHERE id=@cid')
    ]);
    if (pacienteQ.recordset.length === 0) return res.status(400).json({ message: 'Paciente no existe' });
    if (clinicaQ.recordset.length === 0) return res.status(400).json({ message: 'Clínica no existe' });

    const fechaHora = new Date();
    await pool.request()
      .input('paciente_id', mssql.Int, Number(paciente_id))
      .input('clinica_id', mssql.Int, Number(clinica_id))
      .input('estado', mssql.VarChar, 'En espera')
      .input('fechaHora', mssql.DateTime, fechaHora)
      .query(`
        INSERT INTO Turnos (paciente_id, clinica_id, estado, fechaHora)
        VALUES (@paciente_id, @clinica_id, @estado, @fechaHora)
      `);

    console.log('✅ Turno insertado OK');
    return res.json({ message: 'Turno creado correctamente' });
  } catch (err) {
    console.error('❌ Error al crear turno:', err);
    return res.status(500).json({ message: 'Error al crear turno', detail: String(err) });
  }
});

// ===============================
// CONSULTAR Y ACTUALIZAR TURNOS
// ===============================
app.get("/api/turnos", auth, async (req, res) => {
  const estado = req.query.estado || "En espera";
  try {
    const result = await pool
      .request()
      .input("estado", mssql.VarChar, estado)
      .query(`
        SELECT T.id, T.estado, T.fechaHora, P.nombre AS paciente, C.nombre AS clinica
        FROM Turnos T
        JOIN Pacientes P ON T.paciente_id = P.id
        JOIN Clinicas C ON T.clinica_id = C.id
        WHERE T.estado = @estado
        ORDER BY T.fechaHora DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Error al consultar turnos" });
  }
});

app.post("/api/turnos/:id/:accion", auth, async (req, res) => {
  const { id, accion } = req.params;
  let nuevoEstado;
  if (accion === "llamar") nuevoEstado = "Llamado";
  else if (accion === "finalizar") nuevoEstado = "Finalizado";
  else if (accion === "ausente") nuevoEstado = "Ausente";
  else return res.status(400).json({ msg: "Acción inválida" });

  try {
    await pool
      .request()
      .input("id", mssql.Int, id)
      .input("estado", mssql.VarChar, nuevoEstado)
      .query("UPDATE Turnos SET estado=@estado WHERE id=@id");
    res.json({ msg: "Actualizado" });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar turno" });
  }
});

// ===============================
// Servir frontend (sin Nginx)
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/login.html"));
});

// ===============================
// Arrancar servidor
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor listo en http://192.168.1.18:${PORT}`);
});
