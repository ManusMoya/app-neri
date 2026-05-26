const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "products",
  idPrefix: "product",
  orderBy: "created_at DESC",
  searchColumns: ["name", "description"],
  columns: [
    { name: "category_id", required: true },
    { name: "provider_id", required: true },
    { name: "name", required: true },
    { name: "description" },
    { name: "is_active", type: "boolean" },
    { name: "created_at", type: "integer" },
    { name: "updated_at", type: "integer" },
  ],
});
