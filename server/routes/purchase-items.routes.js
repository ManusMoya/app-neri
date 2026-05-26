const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/purchase-items.controller");

module.exports = createCrudRouter(controller);
