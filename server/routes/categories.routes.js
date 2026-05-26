const { createCrudRouter } = require("./crud.routes");
const controller = require("../controllers/categories.controller");

module.exports = createCrudRouter(controller);
