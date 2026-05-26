const { createCrudController } = require("./crud.controller");
const service = require("../services/orders.api-crud.service");

module.exports = createCrudController("Pedido", service);
