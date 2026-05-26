const { createCrudController } = require("./crud.controller");
const service = require("../services/payments.api-crud.service");

module.exports = createCrudController("Pago", service);
