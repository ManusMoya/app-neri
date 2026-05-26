const { createCrudController } = require("./crud.controller");
const service = require("../services/categories.service");

module.exports = createCrudController("Categoria", service);
