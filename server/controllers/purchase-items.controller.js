const { createCrudController } = require("./crud.controller");
const service = require("../services/purchase-items.service");

module.exports = createCrudController("Item de compra", service);
