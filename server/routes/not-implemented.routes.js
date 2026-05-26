const express = require("express");

function createNotImplementedRouter(entityName) {
  const router = express.Router();

  function handler(req, res) {
    res.status(501).json({
      status: "error",
      message: `CRUD de ${entityName} todavia no fue migrado a PostgreSQL.`,
    });
  }

  router.get("/", handler);
  router.get("/:id", handler);
  router.post("/", handler);
  router.patch("/:id", handler);
  router.delete("/:id", handler);

  return router;
}

module.exports = createNotImplementedRouter;
