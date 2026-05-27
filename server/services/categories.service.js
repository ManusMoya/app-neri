const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "categories",
  idPrefix: "category",
  orderBy: "created_at DESC",
  userScoped: true,
  searchColumns: ["name", "description"],
  columns: [
    { name: "name", required: true },
    { name: "description" },
    { name: "created_at", type: "integer" },
    { name: "updated_at", type: "integer" },
  ],
});
