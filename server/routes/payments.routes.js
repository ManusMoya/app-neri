const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/payments.controller");

module.exports = createCrudRouter(controller);
