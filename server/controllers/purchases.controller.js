const { createCrudController } = require("./crud.controller");
const service = require("../services/purchases.api-crud.service");

module.exports = createCrudController("Compra", service);
