const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/order-items.controller");

module.exports = createCrudRouter(controller);
