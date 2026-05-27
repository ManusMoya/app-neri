const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");

function createCrudRouter(controller) {
  const router = express.Router();

  router.use(requireAuth);

  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

module.exports = {
  createCrudRouter,
};
