const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "purchases",
  idPrefix: "purchase",
  orderBy: "purchased_at DESC",
  searchColumns: ["status", "reference", "notes"],
  columns: [
    { name: "provider_id", required: true },
    { name: "status" },
    { name: "subtotal_amount", type: "integer" },
    { name: "shipping_amount", type: "integer" },
    { name: "total_amount", type: "integer" },
    { name: "paid_amount", type: "integer" },
    { name: "balance_due", type: "integer" },
    { name: "reference" },
    { name: "notes" },
    { name: "purchased_at", type: "integer" },
    { name: "created_at", type: "integer" },
    { name: "updated_at", type: "integer" },
  ],
});
