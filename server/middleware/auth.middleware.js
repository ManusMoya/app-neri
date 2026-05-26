const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET no esta configurado en el entorno del servidor.");
    error.statusCode = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
}

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      const error = new Error("Token JWT requerido.");
      error.statusCode = 401;
      throw error;
    }

    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
}

module.exports = {
  getJwtSecret,
  requireAuth,
};
