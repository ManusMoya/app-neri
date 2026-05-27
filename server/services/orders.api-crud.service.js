const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "orders",
  idPrefix: "order",
  orderBy: "ordered_at DESC",
  userScoped: true,
  searchColumns: ["status", "payment_status", "notes"],
  scopedReferences: [
    { column: "client_id", table: "clients" },
  ],
  columns: [
    { name: "client_id", required: true },
    { name: "status" },
    { name: "payment_status" },
    { name: "subtotal_amount", type: "integer" },
    { name: "discount_amount", type: "integer" },
    { name: "total_amount", type: "integer" },
    { name: "deposit_amount", type: "integer" },
    { name: "paid_amount", type: "integer" },
    { name: "balance_due", type: "integer" },
    { name: "notes" },
    { name: "ordered_at", type: "integer" },
    { name: "created_at", type: "integer" },
    { name: "updated_at", type: "integer" },
  ],
});
