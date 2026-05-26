const express = require("express");
const clientsController = require("../controllers/clients.controller");

const router = express.Router();

router.get("/", clientsController.listClients);
router.get("/:id", clientsController.getClient);
router.post("/", clientsController.createClient);
router.patch("/:id", clientsController.updateClient);
router.delete("/:id", clientsController.deleteClient);

module.exports = router;
