const express = require("express");
const clientsController = require("../controllers/clients.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", clientsController.listClients);
router.get("/:id", clientsController.getClient);
router.post("/", clientsController.createClient);
router.patch("/:id", clientsController.updateClient);
router.delete("/:id", clientsController.deleteClient);

module.exports = router;
