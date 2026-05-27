const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "products",
  idPrefix: "product",
  orderBy: "created_at DESC",
  userScoped: true,
  searchColumns: ["name", "description"],
  scopedReferences: [
    { column: "category_id", table: "categories" },
    { column: "provider_id", table: "providers" },
  ],
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
