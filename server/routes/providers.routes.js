const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/providers.controller");

module.exports = createCrudRouter(controller);
