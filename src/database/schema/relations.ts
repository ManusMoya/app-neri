import { relations } from "drizzle-orm";

import { categories } from "./categories";
import { clients } from "./clients";
import { orderItems } from "./order-items";
import { orders } from "./orders";
import { payments } from "./payments";
import { productVariants } from "./product-variants";
import { products } from "./products";
import { providers } from "./providers";
import { purchaseItems } from "./purchase-items";
import { purchases } from "./purchases";

export const clientsRelations = relations(clients, ({ many }) => ({
  orders: many(orders),
}));

export const providersRelations = relations(providers, ({ many }) => ({
  products: many(products),
  purchases: many(purchases),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  provider: one(providers, {
    fields: [products.providerId],
    references: [providers.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  orderItems: many(orderItems),
  purchaseItems: many(purchaseItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  provider: one(providers, {
    fields: [purchases.providerId],
    references: [providers.id],
  }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  productVariant: one(productVariants, {
    fields: [purchaseItems.productVariantId],
    references: [productVariants.id],
  }),
}));
