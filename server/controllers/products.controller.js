const { createCrudController } = require("./crud.controller");
const service = require("../services/products.api-crud.service");

module.exports = createCrudController("Producto", service);
