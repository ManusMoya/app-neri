const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/purchases.controller");

module.exports = createCrudRouter(controller);
