const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "product_variants",
  idPrefix: "variant",
  orderBy: "created_at DESC",
  owner: {
    table: "products",
    alias: "owner_product",
    localColumn: "product_id",
    idColumn: "id",
  },
  scopedReferences: [
    { column: "product_id", table: "products" },
  ],
  searchColumns: ["color", "size", "model", "sku", "barcode"],
  columns: [
    { name: "product_id", required: true },
    { name: "color" },
    { name: "size" },
    { name: "model" },
    { name: "sku" },
    { name: "barcode" },
    { name: "stock", type: "integer" },
    { name: "reserved_stock", type: "integer" },
    { name: "minimum_stock", type: "integer" },
    { name: "cost_price", type: "integer" },
    { name: "sale_price", type: "integer" },
    { name: "is_active", type: "boolean" },
    { name: "created_at", type: "integer" },
    { name: "updated_at", type: "integer" },
  ],
});
