const { createCrudController } = require("./crud.controller");
const service = require("../services/providers.api-crud.service");

module.exports = createCrudController("Proveedor", service);
