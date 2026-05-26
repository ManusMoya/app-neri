const { createCrudController } = require("./crud.controller");
const service = require("../services/product-variants.service");

module.exports = createCrudController("Variante", service);
