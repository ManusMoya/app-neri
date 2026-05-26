const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/product-variants.controller");

module.exports = createCrudRouter(controller);
