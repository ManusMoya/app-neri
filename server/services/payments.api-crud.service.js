const { createCrudService } = require("./crud.service");
const pool = require("../db");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function calculatePaymentStatus(totalAmount, paidAmount) {
  if (paidAmount <= 0) {
    return "unpaid";
  }

  if (paidAmount >= totalAmount) {
    return "paid";
  }

  return "partial";
}

function createId() {
  return `payment_${require("crypto").randomUUID()}`;
}

async function updateClientDebt(client, clientId, userId) {
  await client.query(
    `UPDATE clients
     SET debt = (
       SELECT COALESCE(SUM(balance_due), 0)
       FROM orders
       WHERE client_id = $1 AND user_id = $2 AND status != 'cancelled'
     )
     WHERE id = $1 AND user_id = $2`,
    [clientId, userId],
  );
}

const baseService = createCrudService({
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

module.exports = {
  ...baseService,

  async create(body, userId) {
    const amount = Number(body.amount);

    if (!Number.isInteger(amount) || amount <= 0) {
      throw badRequest("El monto del pago debe ser un entero positivo.");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT id, client_id, status, total_amount, paid_amount, deposit_amount
         FROM orders
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [body.order_id, userId],
      );
      const order = orderResult.rows[0];

      if (!order) {
        throw badRequest("Pedido no encontrado.");
      }

      if (order.status === "cancelled") {
        throw badRequest("No se pueden registrar pagos en un pedido cancelado.");
      }

      const type = body.type || "partial";
      const signedAmount = type === "refund" ? -amount : amount;
      const nextPaidAmount = Math.max(Number(order.paid_amount) + signedAmount, 0);

      if (type !== "refund" && nextPaidAmount > Number(order.total_amount)) {
        throw badRequest("El pago supera el saldo pendiente del pedido.");
      }

      const now = Date.now();
      const paymentResult = await client.query(
        `INSERT INTO payments
          (id, order_id, type, method, status, amount, reference, notes, paid_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, order_id, type, method, status, amount, reference, notes, paid_at, created_at`,
        [
          body.id || createId(),
          body.order_id,
          type,
          body.method || "cash",
          body.status || "completed",
          amount,
          body.reference || null,
          body.notes || null,
          body.paid_at || now,
          body.created_at || now,
        ],
      );
      const payment = paymentResult.rows[0];

      const nextBalanceDue = Math.max(Number(order.total_amount) - nextPaidAmount, 0);
      const paymentStatus = calculatePaymentStatus(Number(order.total_amount), nextPaidAmount);
      const nextDepositAmount = type === "deposit"
        ? Number(order.deposit_amount) + amount
        : Number(order.deposit_amount);

      await client.query(
        `UPDATE orders
         SET paid_amount = $1,
             deposit_amount = $2,
             balance_due = $3,
             payment_status = $4,
             updated_at = $5
         WHERE id = $6 AND user_id = $7`,
        [
          nextPaidAmount,
          nextDepositAmount,
          nextBalanceDue,
          paymentStatus,
          Date.now(),
          order.id,
          userId,
        ],
      );

      await updateClientDebt(client, order.client_id, userId);
      await client.query("COMMIT");

      return payment;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
