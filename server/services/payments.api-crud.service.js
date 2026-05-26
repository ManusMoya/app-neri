const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "payments",
  idPrefix: "payment",
  orderBy: "paid_at DESC",
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
