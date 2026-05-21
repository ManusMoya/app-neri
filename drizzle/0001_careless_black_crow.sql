CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_variant_id` text NOT NULL,
	`product_name` text NOT NULL,
	`variant_label` text,
	`sku` text,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`unit_cost` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`line_subtotal` integer NOT NULL,
	`line_cost_total` integer DEFAULT 0 NOT NULL,
	`profit_amount` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "order_items_quantity_check" CHECK("order_items"."quantity" > 0),
	CONSTRAINT "order_items_unit_price_check" CHECK("order_items"."unit_price" >= 0),
	CONSTRAINT "order_items_unit_cost_check" CHECK("order_items"."unit_cost" >= 0),
	CONSTRAINT "order_items_discount_amount_check" CHECK("order_items"."discount_amount" >= 0),
	CONSTRAINT "order_items_line_subtotal_check" CHECK("order_items"."line_subtotal" >= 0),
	CONSTRAINT "order_items_line_cost_total_check" CHECK("order_items"."line_cost_total" >= 0)
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_variant_id_idx` ON `order_items` (`product_variant_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`subtotal_amount` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`deposit_amount` integer DEFAULT 0 NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`balance_due` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`ordered_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "orders_subtotal_amount_check" CHECK("orders"."subtotal_amount" >= 0),
	CONSTRAINT "orders_discount_amount_check" CHECK("orders"."discount_amount" >= 0),
	CONSTRAINT "orders_total_amount_check" CHECK("orders"."total_amount" >= 0),
	CONSTRAINT "orders_deposit_amount_check" CHECK("orders"."deposit_amount" >= 0),
	CONSTRAINT "orders_paid_amount_check" CHECK("orders"."paid_amount" >= 0),
	CONSTRAINT "orders_balance_due_check" CHECK("orders"."balance_due" >= 0)
);
--> statement-breakpoint
CREATE INDEX `orders_client_id_idx` ON `orders` (`client_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_payment_status_idx` ON `orders` (`payment_status`);--> statement-breakpoint
CREATE INDEX `orders_ordered_at_idx` ON `orders` (`ordered_at`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`type` text DEFAULT 'partial' NOT NULL,
	`method` text DEFAULT 'cash' NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`amount` integer NOT NULL,
	`reference` text,
	`notes` text,
	`paid_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "payments_amount_check" CHECK("payments"."amount" >= 0)
);
--> statement-breakpoint
CREATE INDEX `payments_order_id_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `payments_paid_at_idx` ON `payments` (`paid_at`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`color` text,
	`size` text,
	`model` text,
	`sku` text,
	`barcode` text,
	`stock` integer DEFAULT 0 NOT NULL,
	`reserved_stock` integer DEFAULT 0 NOT NULL,
	`minimum_stock` integer DEFAULT 0 NOT NULL,
	`cost_price` integer DEFAULT 0 NOT NULL,
	`sale_price` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "product_variants_stock_check" CHECK("product_variants"."stock" >= 0),
	CONSTRAINT "product_variants_reserved_stock_check" CHECK("product_variants"."reserved_stock" >= 0),
	CONSTRAINT "product_variants_minimum_stock_check" CHECK("product_variants"."minimum_stock" >= 0),
	CONSTRAINT "product_variants_cost_price_check" CHECK("product_variants"."cost_price" >= 0),
	CONSTRAINT "product_variants_sale_price_check" CHECK("product_variants"."sale_price" >= 0),
	CONSTRAINT "product_variants_is_active_check" CHECK("product_variants"."is_active" in (0, 1))
);
--> statement-breakpoint
CREATE INDEX `product_variants_product_id_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_variants_color_idx` ON `product_variants` (`color`);--> statement-breakpoint
CREATE INDEX `product_variants_size_idx` ON `product_variants` (`size`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_barcode_unique` ON `product_variants` (`barcode`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "products_is_active_check" CHECK("products"."is_active" in (0, 1))
);
--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_provider_id_idx` ON `products` (`provider_id`);--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`whatsapp_link` text,
	`email` text,
	`address` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `providers_name_idx` ON `providers` (`name`);--> statement-breakpoint
CREATE INDEX `providers_phone_idx` ON `providers` (`phone`);--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`product_variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`base_cost` integer NOT NULL,
	`shipping_cost` integer DEFAULT 0 NOT NULL,
	`real_cost` integer NOT NULL,
	`line_total` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "purchase_items_quantity_check" CHECK("purchase_items"."quantity" > 0),
	CONSTRAINT "purchase_items_base_cost_check" CHECK("purchase_items"."base_cost" >= 0),
	CONSTRAINT "purchase_items_shipping_cost_check" CHECK("purchase_items"."shipping_cost" >= 0),
	CONSTRAINT "purchase_items_real_cost_check" CHECK("purchase_items"."real_cost" >= 0),
	CONSTRAINT "purchase_items_line_total_check" CHECK("purchase_items"."line_total" >= 0)
);
--> statement-breakpoint
CREATE INDEX `purchase_items_purchase_id_idx` ON `purchase_items` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `purchase_items_product_variant_id_idx` ON `purchase_items` (`product_variant_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`subtotal_amount` integer DEFAULT 0 NOT NULL,
	`shipping_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`balance_due` integer DEFAULT 0 NOT NULL,
	`reference` text,
	`notes` text,
	`purchased_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "purchases_subtotal_amount_check" CHECK("purchases"."subtotal_amount" >= 0),
	CONSTRAINT "purchases_shipping_amount_check" CHECK("purchases"."shipping_amount" >= 0),
	CONSTRAINT "purchases_total_amount_check" CHECK("purchases"."total_amount" >= 0),
	CONSTRAINT "purchases_paid_amount_check" CHECK("purchases"."paid_amount" >= 0),
	CONSTRAINT "purchases_balance_due_check" CHECK("purchases"."balance_due" >= 0)
);
--> statement-breakpoint
CREATE INDEX `purchases_provider_id_idx` ON `purchases` (`provider_id`);--> statement-breakpoint
CREATE INDEX `purchases_status_idx` ON `purchases` (`status`);--> statement-breakpoint
CREATE INDEX `purchases_purchased_at_idx` ON `purchases` (`purchased_at`);--> statement-breakpoint
CREATE INDEX `clients_name_idx` ON `clients` (`name`);--> statement-breakpoint
CREATE INDEX `clients_phone_idx` ON `clients` (`phone`);