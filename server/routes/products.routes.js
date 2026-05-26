const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/products.controller");

module.exports = createCrudRouter(controller);
