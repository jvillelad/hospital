import { Router } from "express";
import sql from "mssql";
import jwt from "jsonwebtoken";
import { pool, poolConnect } from "../index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  await poolConnect;
  const { correo, password } = req.body;
  try {
    const result = await pool.request()
      .input("correo", sql.NVarChar, correo)
      .query("SELECT TOP 1 * FROM Usuarios WHERE correo=@correo");
    const user = result.recordset[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }
    const token = jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { id: user.id, rol: user.rol, nombre: user.nombre } });
  } catch (e) {
    res.status(500).json({ msg: "Error en login", error: e.message });
  }
});

router.get("/me", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
