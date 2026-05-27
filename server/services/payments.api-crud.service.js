const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "payments",
  idPrefix: "payment",
  orderBy: "paid_at DESC",
  owner: {
    table: "orders",
    alias: "owner_order",
    localColumn: "order_id",
    idColumn: "id",
  },
  scopedReferences: [
    { column: "order_id", table: "orders" },
  ],
  searchColumns: ["type", "method", "status", "reference", "notes"],
  columns: [
    { name: "order_id", required: true },
    { name: "type" },
    { name: "method" },
    { name: "status" },
    { name: "amount", type: "integer", required: true },
    { name: "reference" },
    { name: "notes" },
    { name: "paid_at", type: "integer" },
    { name: "created_at", type: "integer" },
  ],
});
