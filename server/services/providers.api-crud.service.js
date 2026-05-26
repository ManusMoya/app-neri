const { createCrudService } = require("./crud.service");

module.exports = createCrudService({
  table: "providers",
  idPrefix: "provider",
  orderBy: "created_at DESC",
  searchColumns: ["name", "phone", "email"],
  columns: [
    { name: "name", required: true },
    { name: "phone" },
    { name: "whatsapp_link" },
    { name: "email" },
    { name: "address" },
    { name: "notes" },
    { name: "created_at", type: "integer" },
    { name: "updated_at", type: "integer" },
  ],
});
