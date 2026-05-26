const { createCrudController } = require("./crud.controller");
const service = require("../services/order-items.service");

module.exports = createCrudController("Item de pedido", service);
