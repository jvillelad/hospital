import { Router } from "express";
import sql from "mssql";
import { pool, poolConnect } from "../index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// Listado general de turnos (opcional filtro por estado)
router.get("/", verifyToken, async (req, res) => {
  await poolConnect;
  const { estado } = req.query;
  try {
    let query = `SELECT T.id, T.estado, T.fechaHora, 
                        P.nombre AS paciente, C.nombre AS clinica
                 FROM Turnos T
                 JOIN Pacientes P ON T.paciente_id = P.id
                 JOIN Clinicas C ON T.clinica_id = C.id`;
    if (estado) query += " WHERE T.estado=@estado";
    query += " ORDER BY T.id DESC";
    const r = await pool.request()
      .input("estado", sql.NVarChar, estado || null)
      .query(query);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ msg: "Error listando turnos", error: e.message });
  }
});

// Crear turno desde triaje
router.post("/", verifyToken, async (req, res) => {
  await poolConnect;
  const { paciente_id, clinica_id } = req.body;
  try {
    await pool.request()
      .input("paciente_id", sql.Int, paciente_id)
      .input("clinica_id", sql.Int, clinica_id)
      .input("estado", sql.NVarChar, "En espera")
      .query("INSERT INTO Turnos (paciente_id, clinica_id, estado) VALUES (@paciente_id, @clinica_id, @estado)");
    res.json({ msg: "Turno creado" });
  } catch (e) {
    res.status(500).json({ msg: "Error creando turno", error: e.message });
  }
});

// Acciones del médico
router.post("/:id/llamar", verifyToken, async (req, res) => {
  await poolConnect;
  const { id } = req.params;
  try {
    await pool.request().input("id", sql.Int, id)
      .query("UPDATE Turnos SET estado='Llamado' WHERE id=@id");
    res.json({ msg: "Turno llamado" });
  } catch (e) {
    res.status(500).json({ msg: "Error llamando turno", error: e.message });
  }
});

router.post("/:id/finalizar", verifyToken, async (req, res) => {
  await poolConnect;
  const { id } = req.params;
  try {
    await pool.request().input("id", sql.Int, id)
      .query("UPDATE Turnos SET estado='Finalizado' WHERE id=@id");
    res.json({ msg: "Turno finalizado" });
  } catch (e) {
    res.status(500).json({ msg: "Error finalizando turno", error: e.message });
  }
});

router.post("/:id/ausente", verifyToken, async (req, res) => {
  await poolConnect;
  const { id } = req.params;
  try {
    await pool.request().input("id", sql.Int, id)
      .query("UPDATE Turnos SET estado='Ausente' WHERE id=@id");
    res.json({ msg: "Turno marcado como ausente" });
  } catch (e) {
    res.status(500).json({ msg: "Error marcando ausencia", error: e.message });
  }
});

// Endpoint para display de sala de espera (no requiere auth en demo)
router.get("/display/public", async (req, res) => {
  await poolConnect;
  try {
    const actuales = await pool.request().query(
      "SELECT TOP 3 T.id, P.nombre AS paciente, C.nombre AS clinica FROM Turnos T JOIN Pacientes P ON T.paciente_id=P.id JOIN Clinicas C ON T.clinica_id=C.id WHERE T.estado='Llamado' ORDER BY T.id DESC"
    );
    const enEspera = await pool.request().query(
      "SELECT TOP 10 T.id, P.nombre AS paciente, C.nombre AS clinica FROM Turnos T JOIN Pacientes P ON T.paciente_id=P.id JOIN Clinicas C ON T.clinica_id=C.id WHERE T.estado='En espera' ORDER BY T.id ASC"
    );
    res.json({ actuales: actuales.recordset, enEspera: enEspera.recordset });
  } catch (e) {
    res.status(500).json({ msg: "Error en display", error: e.message });
  }
});

export default router;
