const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "purchases",
  idPrefix: "purchase",
  orderBy: "purchased_at DESC",
  userScoped: true,
  searchColumns: ["status", "reference", "notes"],
  scopedReferences: [
    { column: "provider_id", table: "providers" },
  ],
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
