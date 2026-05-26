import { getSQLiteConnection } from "@/database";
import {
  type Order,
  type OrderItem,
} from "@/database/schema";
import { createId } from "@/utils/ids";
import { requireCurrentUser } from "./auth.service";

export const ORDER_WORKFLOW_STATUS = {
  PENDING: "draft",
  RESERVED: "reserved",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderWorkflowStatus =
  (typeof ORDER_WORKFLOW_STATUS)[keyof typeof ORDER_WORKFLOW_STATUS];

export interface CreateOrderItemInput {
  productVariantId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CreateOrderInput {
  clientId: string;
  items: CreateOrderItemInput[];
  discountAmount?: number;
  depositAmount?: number;
  notes?: string;
  status?: OrderWorkflowStatus;
  orderedAt?: Date;
}

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

type VariantOrderRow = {
  id: string;
  stock: number;
  reserved_stock: number;
  cost_price: number;
  sale_price: number;
  sku: string | null;
  color: string | null;
  size: string | null;
  model: string | null;
  product_name: string;
};

type OrderItemRow = {
  id: string;
  productVariantId: string;
  productName: string;
  variantLabel: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  lineSubtotal: number;
  lineCostTotal: number;
  profitAmount: number;
};

function assertPositiveAmount(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer amount.`);
  }
}

function assertPositiveQuantity(value: number) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Item quantity must be a positive integer.");
  }
}

function buildVariantLabel(variant: {
  color: string | null;
  size: string | null;
  model: string | null;
}) {
  return [variant.color, variant.size, variant.model].filter(Boolean).join(" / ") || null;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  if (input.items.length === 0) {
    throw new Error("An order must contain at least one item.");
  }

  const discountAmount = input.discountAmount ?? 0;
  const depositAmount = input.depositAmount ?? 0;
  const status = input.status ?? ORDER_WORKFLOW_STATUS.PENDING;

  assertPositiveAmount(discountAmount, "discountAmount");
  assertPositiveAmount(depositAmount, "depositAmount");

  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const client = await sqlite.getFirstAsync<{ id: string }>(
    "select id from clients where id = ? and user_id = ?",
    input.clientId,
    user.id,
  );

  if (!client) {
    throw new Error("Selecciona un cliente de este usuario.");
  }

  const orderId = createId("order");
  const now = Date.now();
  const orderedAt = input.orderedAt?.getTime() ?? now;
  const itemRows: OrderItemRow[] = [];

  for (const item of input.items) {
      assertPositiveQuantity(item.quantity);

      const variant = await sqlite.getFirstAsync<VariantOrderRow>(
        `select
          v.id,
          v.stock,
          v.reserved_stock,
          v.cost_price,
          v.sale_price,
          v.sku,
          v.color,
          v.size,
          v.model,
          p.name as product_name
        from product_variants v
        inner join products p on p.id = v.product_id
        where v.id = ? and v.is_active = 1 and p.is_active = 1 and p.user_id = ?`,
        item.productVariantId,
        user.id,
      );

      if (!variant) {
        throw new Error("La variante seleccionada no existe.");
      }

      const availableStock = variant.stock - variant.reserved_stock;

      if (
        (status === ORDER_WORKFLOW_STATUS.RESERVED ||
          status === ORDER_WORKFLOW_STATUS.DELIVERED) &&
        availableStock < item.quantity
      ) {
        throw new Error(`Stock insuficiente para ${variant.product_name}.`);
      }

      const unitPrice = item.unitPrice ?? variant.sale_price;
      const lineDiscount = item.discountAmount ?? 0;

      assertPositiveAmount(unitPrice, "unitPrice");
      assertPositiveAmount(lineDiscount, "discountAmount");

      const grossSubtotal = unitPrice * item.quantity;
      const lineSubtotal = Math.max(grossSubtotal - lineDiscount, 0);
      const lineCostTotal = variant.cost_price * item.quantity;

      itemRows.push({
        id: createId("order_item"),
        productVariantId: item.productVariantId,
        productName: variant.product_name,
        variantLabel: buildVariantLabel(variant),
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice,
        unitCost: variant.cost_price,
        discountAmount: lineDiscount,
        lineSubtotal,
        lineCostTotal,
        profitAmount: lineSubtotal - lineCostTotal,
      });
  }

    const subtotalAmount = itemRows.reduce((sum, item) => sum + item.lineSubtotal, 0);
    const totalAmount = Math.max(subtotalAmount - discountAmount, 0);
    const paidAmount = Math.min(depositAmount, totalAmount);
    const balanceDue = totalAmount - paidAmount;

  await sqlite.withTransactionAsync(async () => {
    await sqlite.runAsync(
      `insert into orders
        (id, user_id, client_id, status, payment_status, subtotal_amount, discount_amount,
          total_amount, deposit_amount, paid_amount, balance_due, notes, ordered_at,
          created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      orderId,
      user.id,
      input.clientId,
      status,
      paidAmount === 0 ? "unpaid" : balanceDue === 0 ? "paid" : "partial",
      subtotalAmount,
      discountAmount,
      totalAmount,
      paidAmount,
      paidAmount,
      balanceDue,
      input.notes ?? null,
      orderedAt,
      now,
      now,
    );

    for (const item of itemRows) {
      await sqlite.runAsync(
        `insert into order_items
          (id, order_id, product_variant_id, product_name, variant_label, sku, quantity,
            unit_price, unit_cost, discount_amount, line_subtotal, line_cost_total,
            profit_amount, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        orderId,
        item.productVariantId,
        item.productName,
        item.variantLabel,
        item.sku,
        item.quantity,
        item.unitPrice,
        item.unitCost,
        item.discountAmount,
        item.lineSubtotal,
        item.lineCostTotal,
        item.profitAmount,
        now,
      );
    }

    if (paidAmount > 0) {
      await sqlite.runAsync(
        `insert into payments
          (id, order_id, type, method, status, amount, paid_at, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)`,
        createId("payment"),
        orderId,
        "deposit",
        "cash",
        "completed",
        paidAmount,
        now,
        now,
      );
    }

    for (const item of itemRows) {
      if (status === ORDER_WORKFLOW_STATUS.RESERVED) {
        await sqlite.runAsync(
          "update product_variants set reserved_stock = reserved_stock + ?, updated_at = ? where id = ?",
          item.quantity,
          now,
          item.productVariantId,
        );
      }

      if (status === ORDER_WORKFLOW_STATUS.DELIVERED) {
        await sqlite.runAsync(
          "update product_variants set stock = stock - ?, updated_at = ? where id = ?",
          item.quantity,
          now,
          item.productVariantId,
        );
      }
    }

    await sqlite.runAsync(
      `update clients
      set debt = (
        select coalesce(sum(balance_due), 0)
        from orders
        where client_id = ? and user_id = ? and status != 'cancelled'
      )
      where id = ?`,
      input.clientId,
      user.id,
      input.clientId,
    );
  });

  const order = await sqlite.getFirstAsync<Order>(
    "select * from orders where id = ? and user_id = ?",
    orderId,
    user.id,
  );
  const items = await sqlite.getAllAsync<OrderItem>("select * from order_items where order_id = ?", orderId);

  if (!order) {
    throw new Error("No se pudo cargar el pedido creado.");
  }

  return { order, items };
}

export async function changeOrderStatus(orderId: string, nextStatus: OrderWorkflowStatus) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const order = await sqlite.getFirstAsync<{
    id: string;
    client_id: string;
    status: OrderWorkflowStatus;
  }>("select id, client_id, status from orders where id = ? and user_id = ?", orderId, user.id);

  if (!order) {
    throw new Error("Pedido no encontrado.");
  }

  if (order.status === nextStatus) {
    return order;
  }

  if (order.status === ORDER_WORKFLOW_STATUS.DELIVERED) {
    throw new Error("Los pedidos entregados no se pueden cambiar de estado.");
  }

  const items = await sqlite.getAllAsync<{
    product_variant_id: string;
    product_name: string;
    quantity: number;
  }>("select product_variant_id, product_name, quantity from order_items where order_id = ?", orderId);
  const now = Date.now();

  await sqlite.withTransactionAsync(async () => {
    if (
      nextStatus === ORDER_WORKFLOW_STATUS.RESERVED ||
      nextStatus === ORDER_WORKFLOW_STATUS.DELIVERED
    ) {
      for (const item of items) {
        const variant = await sqlite.getFirstAsync<{
          stock: number;
          reserved_stock: number;
        }>(
          `select product_variants.stock, product_variants.reserved_stock
          from product_variants
          inner join products on products.id = product_variants.product_id
          where product_variants.id = ? and products.user_id = ?`,
          item.product_variant_id,
          user.id,
        );

        const availableStock = order.status === ORDER_WORKFLOW_STATUS.RESERVED
          ? variant?.stock ?? 0
          : (variant?.stock ?? 0) - (variant?.reserved_stock ?? 0);

        if (!variant || availableStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${item.product_name}.`);
        }
      }
    }

    for (const item of items) {
      if (order.status === ORDER_WORKFLOW_STATUS.RESERVED) {
        await sqlite.runAsync(
          `update product_variants
          set reserved_stock = case
            when reserved_stock - ? < 0 then 0
            else reserved_stock - ?
          end,
          updated_at = ?
          where id = ?`,
          item.quantity,
          item.quantity,
          now,
          item.product_variant_id,
        );
      }

      if (nextStatus === ORDER_WORKFLOW_STATUS.RESERVED) {
        await sqlite.runAsync(
          "update product_variants set reserved_stock = reserved_stock + ?, updated_at = ? where id = ?",
          item.quantity,
          now,
          item.product_variant_id,
        );
      }

      if (nextStatus === ORDER_WORKFLOW_STATUS.DELIVERED) {
        await sqlite.runAsync(
          "update product_variants set stock = stock - ?, updated_at = ? where id = ?",
          item.quantity,
          now,
          item.product_variant_id,
        );
      }
    }

    await sqlite.runAsync(
      "update orders set status = ?, updated_at = ? where id = ?",
      nextStatus,
      now,
      order.id,
    );

    await sqlite.runAsync(
      `update clients
      set debt = (
        select coalesce(sum(balance_due), 0)
        from orders
        where client_id = ? and user_id = ? and status != 'cancelled'
      )
      where id = ?`,
      order.client_id,
      user.id,
      order.client_id,
    );
  });

  return sqlite.getFirstAsync<Order>(
    "select * from orders where id = ? and user_id = ?",
    orderId,
    user.id,
  );
}

type OrderDeleteRow = {
  id: string;
  client_id: string;
  status: OrderWorkflowStatus;
};

type OrderDeleteItemRow = {
  product_variant_id: string;
  quantity: number;
};

export async function removeOrder(orderId: string) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const order = await sqlite.getFirstAsync<OrderDeleteRow>(
    "select id, client_id, status from orders where id = ? and user_id = ?",
    orderId,
    user.id,
  );

  if (!order) {
    throw new Error("Pedido no encontrado.");
  }

  const items = await sqlite.getAllAsync<OrderDeleteItemRow>(
    "select product_variant_id, quantity from order_items where order_id = ?",
    orderId,
  );
  const now = Date.now();

  await sqlite.withTransactionAsync(async () => {
    for (const item of items) {
      if (order.status === ORDER_WORKFLOW_STATUS.RESERVED) {
        await sqlite.runAsync(
          `update product_variants
          set reserved_stock = case
            when reserved_stock - ? < 0 then 0
            else reserved_stock - ?
          end,
          updated_at = ?
          where id = ?`,
          item.quantity,
          item.quantity,
          now,
          item.product_variant_id,
        );
      }

      if (order.status === ORDER_WORKFLOW_STATUS.DELIVERED) {
        await sqlite.runAsync(
          "update product_variants set stock = stock + ?, updated_at = ? where id = ?",
          item.quantity,
          now,
          item.product_variant_id,
        );
      }
    }

    await sqlite.runAsync("delete from payments where order_id = ?", orderId);
    await sqlite.runAsync("delete from order_items where order_id = ?", orderId);
    const result = await sqlite.runAsync("delete from orders where id = ?", orderId);

    if (result.changes === 0) {
      throw new Error("No se pudo eliminar el pedido.");
    }

    await sqlite.runAsync(
      `update clients
      set debt = (
        select coalesce(sum(balance_due), 0)
        from orders
        where client_id = ? and user_id = ? and status != 'cancelled'
      )
      where id = ?`,
      order.client_id,
      user.id,
      order.client_id,
    );
  });
}
