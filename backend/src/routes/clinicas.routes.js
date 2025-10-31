import { Router } from "express";
import sql from "mssql";
import { pool, poolConnect } from "../index.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  await poolConnect;
  try {
    const result = await pool.request().query("SELECT * FROM Clinicas ORDER BY nombre");
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ msg: "Error listando clínicas", error: e.message });
  }
});

router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  await poolConnect;
  const { nombre } = req.body;
  try {
    await pool.request().input("nombre", sql.NVarChar, nombre).query("INSERT INTO Clinicas (nombre) VALUES (@nombre)");
    res.json({ msg: "Clínica creada" });
  } catch (e) {
    res.status(500).json({ msg: "Error creando clínica", error: e.message });
  }
});

export default router;
