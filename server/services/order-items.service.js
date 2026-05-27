const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "order_items",
  idPrefix: "order_item",
  orderBy: "created_at DESC",
  owner: {
    table: "orders",
    alias: "owner_order",
    localColumn: "order_id",
    idColumn: "id",
  },
  scopedReferences: [
    { column: "order_id", table: "orders" },
  ],
  searchColumns: ["product_name", "variant_label", "sku"],
  columns: [
    { name: "order_id", required: true },
    { name: "product_variant_id", required: true },
    { name: "product_name", required: true },
    { name: "variant_label" },
    { name: "sku" },
    { name: "quantity", type: "integer", required: true },
    { name: "unit_price", type: "integer", required: true },
    { name: "unit_cost", type: "integer" },
    { name: "discount_amount", type: "integer" },
    { name: "line_subtotal", type: "integer", required: true },
    { name: "line_cost_total", type: "integer" },
    { name: "profit_amount", type: "integer" },
    { name: "created_at", type: "integer" },
  ],
});
