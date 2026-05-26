const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/orders.controller");

module.exports = createCrudRouter(controller);
