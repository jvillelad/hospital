import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(403).json({ msg: "Falta token" });
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ msg: "Token inválido" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: "No autenticado" });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ msg: "No autorizado" });
    next();
  }
}
