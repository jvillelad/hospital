import { Router } from "express";
import sql from "mssql";
import { pool, poolConnect } from "../index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  await poolConnect;
  try {
    const result = await pool.request().query("SELECT * FROM Pacientes ORDER BY id DESC");
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ msg: "Error listando pacientes", error: e.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  await poolConnect;
  const { nombre, edad, sintomas } = req.body;
  try {
    await pool.request()
      .input("nombre", sql.NVarChar, nombre)
      .input("edad", sql.Int, edad)
      .input("sintomas", sql.NVarChar, sintomas)
      .input("estado", sql.NVarChar, "Registrado")
      .query("INSERT INTO Pacientes (nombre, edad, sintomas, estado) VALUES (@nombre, @edad, @sintomas, @estado)");
    res.json({ msg: "Paciente registrado" });
  } catch (e) {
    res.status(500).json({ msg: "Error creando paciente", error: e.message });
  }
});

export default router;
