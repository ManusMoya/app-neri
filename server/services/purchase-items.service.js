const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "purchase_items",
  idPrefix: "purchase_item",
  orderBy: "created_at DESC",
  owner: {
    table: "purchases",
    alias: "owner_purchase",
    localColumn: "purchase_id",
    idColumn: "id",
  },
  scopedReferences: [
    { column: "purchase_id", table: "purchases" },
  ],
  columns: [
    { name: "purchase_id", required: true },
    { name: "product_variant_id", required: true },
    { name: "quantity", type: "integer", required: true },
    { name: "base_cost", type: "integer", required: true },
    { name: "shipping_cost", type: "integer" },
    { name: "real_cost", type: "integer", required: true },
    { name: "line_total", type: "integer", required: true },
    { name: "created_at", type: "integer" },
  ],
});
