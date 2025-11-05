// ===============================
// Sistema Visual de Cola de Turnos
// Backend con Socket.IO + SQL Server
// ===============================

import express from "express";
import cors from "cors";
import mssql from "mssql";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// Conexión a SQL Server con reconexión automática
// ===============================
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    enableArithAbort: true
  }
};

let pool;

async function getPool() {
  try {
    if (!pool || !pool.connected) {
      console.log("🔄 Conectando a SQL Server...");
      pool = await mssql.connect(dbConfig);
      console.log("✅ Conectado a SQL Server");
    }
    return pool;
  } catch (err) {
    console.error("❌ Error al conectar con SQL:", err);
    throw err;
  }
}

async function safeRequest() {
  const db = await getPool();
  return db.request();
}

// ===============================
// HTTP básico
// ===============================
app.get("/api", (req, res) => res.json({ ok: true, name: "Hospital Turnos API" }));

// ===============================
// Login
// ===============================
app.post("/api/login", async (req, res) => {
  const { correo, password } = req.body;
  try {
    const result = await (await safeRequest())
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
    console.error("❌ Error en /api/login:", err);
    res.status(500).json({ message: "Error en servidor" });
  }
});

// ===============================
// Servir Frontend con rutas limpias (sin .html)
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "../../frontend")));

// Middleware para quitar .html y redirigir limpio
app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    return res.redirect(301, req.path.replace(".html", ""));
  }
  next();
});

// Rutas principales sin extensión
app.get("/:page?", (req, res) => {
  const page = req.params.page || "login";
  const filePath = path.join(__dirname, `../../frontend/${page}.html`);
  res.sendFile(filePath);
});

// ===============================
// Socket.IO
// ===============================
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.use((socket, next) => {
  const { token, publicDisplay } = socket.handshake.auth || {};

  // 🔓 Permitir conexión pública para la pantalla de Display
  if (publicDisplay === true || publicDisplay === "true") {
    console.log("🖥️ Conexión pública permitida (Display)");
    return next();
  }

  try {
    if (!token) return next(new Error("Token faltante"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Token inválido"));
  }
});

function broadcastTurnosChanged() {
  io.emit("turnos:changed");
}

// ===============================
// EVENTOS DE SOCKET.IO
// ===============================
io.on("connection", (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id} (user:${socket.user?.id})`);

  // --- CLÍNICAS ---
  socket.on("clinicas:list", async (cb) => {
    try {
      const result = await (await safeRequest()).query("SELECT * FROM Clinicas");
      cb?.({ ok: true, data: result.recordset });
    } catch {
      cb?.({ ok: false, message: "Error al consultar clínicas" });
    }
  });

  // --- PACIENTES DISPONIBLES ---
  socket.on("pacientes:list", async (cb) => {
    try {
      const result = await (await safeRequest()).query(`
        SELECT P.id, P.nombre
        FROM Pacientes P
        WHERE P.estado IN ('Registrado', 'Nuevo')
        AND P.id NOT IN (
          SELECT paciente_id FROM Turnos WHERE estado IN ('En espera', 'Llamado', 'En consulta')
        )
        ORDER BY P.nombre
      `);
      cb?.({ ok: true, data: result.recordset });
    } catch (err) {
      console.error("❌ pacientes:list", err);
      cb?.({ ok: false, message: "Error al consultar pacientes" });
    }
  });

  // --- REGISTRO O ACTUALIZACIÓN DE PACIENTE ---
  socket.on("paciente:create", async (payload, cb) => {
    try {
      const { nombre, edad, sintomas } = payload || {};
      if (!nombre || !edad || !sintomas)
        return cb?.({ ok: false, message: "Datos incompletos" });

      const existente = await (await safeRequest())
        .input("nombre", mssql.VarChar, nombre)
        .query("SELECT TOP 1 * FROM Pacientes WHERE nombre=@nombre");

      if (existente.recordset.length > 0) {
        const paciente = existente.recordset[0];
        const nuevoEstado = "Registrado";
        await (await safeRequest())
          .input("nombre", mssql.VarChar, nombre)
          .input("edad", mssql.Int, edad)
          .input("sintomas", mssql.VarChar, sintomas)
          .input("estado", mssql.VarChar, nuevoEstado)
          .query(`
            UPDATE Pacientes
            SET edad=@edad, sintomas=@sintomas, estado=@estado
            WHERE nombre=@nombre
          `);
        return cb?.({ ok: true, updated: true, message: "Paciente reactivado o actualizado correctamente" });
      }

      await (await safeRequest())
        .input("nombre", mssql.VarChar, nombre)
        .input("edad", mssql.Int, edad)
        .input("sintomas", mssql.VarChar, sintomas)
        .input("estado", mssql.VarChar, "Registrado")
        .query(`
          INSERT INTO Pacientes (nombre, edad, sintomas, estado)
          VALUES (@nombre, @edad, @sintomas, @estado)
        `);

      cb?.({ ok: true, created: true, message: "Paciente registrado correctamente" });
    } catch (err) {
      console.error("❌ paciente:create", err);
      cb?.({ ok: false, message: "Error al registrar paciente" });
    }
  });

  // --- CREAR TURNO ---
  socket.on("turno:create", async (payload, cb) => {
    try {
      const { paciente_id, clinica_id } = payload || {};
      if (!paciente_id || !clinica_id)
        return cb?.({ ok: false, message: "Datos incompletos" });

      const db = await getPool();

      const prefijoQuery = await db.request()
        .input("id", mssql.Int, clinica_id)
        .query("SELECT TOP 1 prefijo FROM Clinicas WHERE id=@id");

      const prefijo = (prefijoQuery.recordset[0]?.prefijo || "A").toUpperCase();

      const ultimo = await db.request()
        .input("cid", mssql.Int, clinica_id)
        .input("pref", mssql.VarChar, prefijo + '%')
        .query(`
          SELECT TOP 1 ticket
          FROM Turnos
          WHERE clinica_id=@cid AND ticket LIKE @pref
          ORDER BY id DESC
        `);

      let nuevoTicket = `${prefijo}001`;
      if (ultimo.recordset.length > 0) {
        const prev = ultimo.recordset[0].ticket;
        const num = parseInt(prev.replace(prefijo, "")) + 1;
        nuevoTicket = prefijo + num.toString().padStart(3, "0");
      }

      await db.request()
        .input("paciente_id", mssql.Int, paciente_id)
        .input("clinica_id", mssql.Int, clinica_id)
        .input("estado", mssql.VarChar, "En espera")
        .input("fechaHora", mssql.DateTime, new Date())
        .input("ticket", mssql.VarChar, nuevoTicket)
        .query(`
          INSERT INTO Turnos (paciente_id, clinica_id, estado, fechaHora, ticket)
          VALUES (@paciente_id, @clinica_id, @estado, @fechaHora, @ticket)
        `);

      await db.request()
        .input("id", mssql.Int, paciente_id)
        .input("estado", mssql.VarChar, "En espera")
        .query("UPDATE Pacientes SET estado=@estado WHERE id=@id");

      cb?.({ ok: true, message: "Turno creado correctamente", ticket: nuevoTicket });
      broadcastTurnosChanged();
    } catch (err) {
      console.error("❌ turno:create", err);
      cb?.({ ok: false, message: "Error al crear turno" });
    }
  });

  // --- LISTAR TURNOS ---
  socket.on("turnos:list", async (estado, cb) => {
    try {
      const db = await getPool();
      const result = await db.request()
        .input("estado", mssql.VarChar, estado)
        .query(`
          SELECT
            t.id,
            p.nombre AS paciente,
            c.nombre AS clinica,
            t.estado,
            t.ticket,
            FORMAT(t.fechaHora, 'yyyy-MM-dd HH:mm:ss') AS fechaHora
          FROM Turnos t
          INNER JOIN Pacientes p ON p.id = t.paciente_id
          INNER JOIN Clinicas c ON c.id = t.clinica_id
          WHERE t.estado = @estado
          ORDER BY t.id DESC
        `);

      cb({ ok: true, data: result.recordset });
    } catch (err) {
      console.error("❌ Error en turnos:list:", err);
      cb({ ok: false, message: "Error al listar turnos" });
    }
  });

  // --- ACCIONES SOBRE TURNOS ---
  socket.on("turno:accion", async (payload, cb) => {
    try {
      const { id, accion } = payload || {};
      if (!id || !accion) return cb?.({ ok: false, message: "Datos incompletos" });

      let nuevoEstado;
      if (accion === "llamar") nuevoEstado = "Llamado";
      else if (accion === "finalizar") nuevoEstado = "Finalizado";
      else if (accion === "ausente") nuevoEstado = "Ausente";
      else return cb?.({ ok: false, message: "Acción inválida" });

      await (await safeRequest())
        .input("id", mssql.Int, id)
        .input("estado", mssql.VarChar, nuevoEstado)
        .query("UPDATE Turnos SET estado=@estado WHERE id=@id");

      if (nuevoEstado === "Finalizado") {
        await (await safeRequest())
          .input("tid", mssql.Int, id)
          .query(`
            UPDATE Pacientes
            SET estado = 'Finalizado'
            WHERE id = (SELECT paciente_id FROM Turnos WHERE id=@tid)
          `);
      }

      cb?.({ ok: true, message: "Estado actualizado" });
      broadcastTurnosChanged();
    } catch (err) {
      console.error("❌ turno:accion", err);
      cb?.({ ok: false, message: "Error al actualizar turno" });
    }
  });

  socket.on("disconnect", () => console.log(`🔌 Socket desconectado: ${socket.id}`));
});

// ===============================
// ARRANCAR SERVIDOR EN PUERTO 80
// ===============================
const PORT = 80;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor listo en http://clinica.securitylabs.site`);
});
