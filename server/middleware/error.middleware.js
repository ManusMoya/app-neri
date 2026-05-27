function notFound(req, res) {
  res.status(404).json({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error("API ERROR:", error);

  const statusCode = error.statusCode || 500;
  const message = error.message || "Error interno del servidor.";
  const payload = {
    status: "error",
    message,
    code: error.code,
    detail: error.detail,
  };

  if (process.env.EXPOSE_ERROR_STACK === "true") {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  errorHandler,
  notFound,
};
