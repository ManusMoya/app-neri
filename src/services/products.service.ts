import { getSQLiteConnection } from "@/database";
import { createId } from "@/utils/ids";

import type {
  ProductFormValues,
  ProductListRecord,
  ProductStockFilter,
  ProductVariantFormValues,
  ProductWithDetails,
} from "@/modules/products/types";
import {
  getProductMetrics,
  getStockStatus,
} from "@/modules/products/utils";
import { requireCurrentUser } from "./auth.service";

function cleanText(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

type ProductDetailsRow = {
  id: string;
  category_id: string;
  provider_id: string;
  name: string;
  description: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
  category_name: string;
  category_description: string | null;
  category_created_at: number;
  category_updated_at: number;
  provider_name: string;
  provider_phone: string | null;
  provider_whatsapp_link: string | null;
  provider_email: string | null;
  provider_address: string | null;
  provider_notes: string | null;
  provider_created_at: number;
  provider_updated_at: number;
  variant_id: string | null;
  variant_color: string | null;
  variant_size: string | null;
  variant_model: string | null;
  variant_sku: string | null;
  variant_barcode: string | null;
  variant_stock: number | null;
  variant_reserved_stock: number | null;
  variant_minimum_stock: number | null;
  variant_cost_price: number | null;
  variant_sale_price: number | null;
  variant_is_active: number | null;
  variant_created_at: number | null;
  variant_updated_at: number | null;
};

type NamedRow = {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  whatsapp_link?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: number;
  updated_at: number;
};

function toDate(value: number | string | Date) {
  return value instanceof Date ? value : new Date(Number(value));
}

function toProductWithDetails(rows: ProductDetailsRow[]): ProductWithDetails | null {
  const first = rows[0];

  if (!first) {
    return null;
  }

  return {
    id: first.id,
    categoryId: first.category_id,
    providerId: first.provider_id,
    name: first.name,
    description: first.description,
    isActive: Boolean(first.is_active),
    createdAt: toDate(first.created_at),
    updatedAt: toDate(first.updated_at),
    category: {
      id: first.category_id,
      name: first.category_name,
      description: first.category_description,
      createdAt: toDate(first.category_created_at),
      updatedAt: toDate(first.category_updated_at),
    },
    provider: {
      id: first.provider_id,
      name: first.provider_name,
      phone: first.provider_phone,
      whatsappLink: first.provider_whatsapp_link,
      email: first.provider_email,
      address: first.provider_address,
      notes: first.provider_notes,
      createdAt: toDate(first.provider_created_at),
      updatedAt: toDate(first.provider_updated_at),
    },
    variants: rows.flatMap((row) => {
      if (!row.variant_id) {
        return [];
      }

      return [{
        id: row.variant_id,
        productId: row.id,
        color: row.variant_color,
        size: row.variant_size,
        model: row.variant_model,
        sku: row.variant_sku,
        barcode: row.variant_barcode,
        stock: row.variant_stock ?? 0,
        reservedStock: row.variant_reserved_stock ?? 0,
        minimumStock: row.variant_minimum_stock ?? 0,
        costPrice: row.variant_cost_price ?? 0,
        salePrice: row.variant_sale_price ?? 0,
        isActive: Boolean(row.variant_is_active),
        createdAt: toDate(row.variant_created_at ?? first.created_at),
        updatedAt: toDate(row.variant_updated_at ?? first.updated_at),
      }];
    }),
  };
}

function toVariantPayload(productId: string, values: ProductVariantFormValues) {
  return {
    productId,
    color: cleanText(values.color),
    size: cleanText(values.size),
    model: cleanText(values.model),
    sku: null,
    barcode: null,
    costPrice: values.costPrice,
    salePrice: values.salePrice,
    isActive: true,
  };
}

function toProductListItem(product: ProductWithDetails): ProductListRecord {
  return {
    ...product,
    ...getProductMetrics(product.variants),
  };
}

function matchesSearch(product: ProductWithDetails, searchTerm: string) {
  const normalized = searchTerm.trim().toLocaleLowerCase();

  if (!normalized) {
    return true;
  }

  return product.name.toLocaleLowerCase().includes(normalized);
}

function matchesStockFilter(product: ProductListRecord, filter: ProductStockFilter) {
  if (filter === "all") {
    return true;
  }

  const variants = product.variants.filter((variant) => variant.isActive);

  return variants.length > 0 && variants.every((variant) => getStockStatus(variant) === "out");
}

async function getOrCreateCategory(name: string) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const normalized = normalizeName(name);
  const existing = await sqlite.getFirstAsync<NamedRow>(
    "select * from categories where name = ? and user_id = ?",
    normalized,
    user.id,
  );

  if (existing) {
    return {
      ...existing,
      description: existing.description ?? null,
      createdAt: toDate(existing.created_at),
      updatedAt: toDate(existing.updated_at),
    };
  }

  const now = Date.now();
  const id = createId("category");

  await sqlite.runAsync(
    "insert into categories (id, user_id, name, description, created_at, updated_at) values (?, ?, ?, ?, ?, ?)",
    id,
    user.id,
    normalized,
    null,
    now,
    now,
  );

  return { id, name: normalized, description: null, createdAt: toDate(now), updatedAt: toDate(now) };
}

async function getProviderById(id: string) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const existing = await sqlite.getFirstAsync<NamedRow>(
    "select * from providers where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!existing) {
    throw new Error("Selecciona un proveedor existente antes de crear el producto.");
  }

  return {
    id: existing.id,
    name: existing.name,
    phone: existing.phone ?? null,
    whatsappLink: existing.whatsapp_link ?? null,
    email: existing.email ?? null,
    address: existing.address ?? null,
    notes: existing.notes ?? null,
    createdAt: toDate(existing.created_at),
    updatedAt: toDate(existing.updated_at),
  };
}

async function getProductRows(id?: string) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const where = id
    ? "where p.id = ? and p.user_id = ? and p.is_active = 1"
    : "where p.user_id = ? and p.is_active = 1";

  return sqlite.getAllAsync<ProductDetailsRow>(
    `select
      p.id,
      p.category_id,
      p.provider_id,
      p.name,
      p.description,
      p.is_active,
      p.created_at,
      p.updated_at,
      c.name as category_name,
      c.description as category_description,
      c.created_at as category_created_at,
      c.updated_at as category_updated_at,
      pr.name as provider_name,
      pr.phone as provider_phone,
      pr.whatsapp_link as provider_whatsapp_link,
      pr.email as provider_email,
      pr.address as provider_address,
      pr.notes as provider_notes,
      pr.created_at as provider_created_at,
      pr.updated_at as provider_updated_at,
      v.id as variant_id,
      v.color as variant_color,
      v.size as variant_size,
      v.model as variant_model,
      v.sku as variant_sku,
      v.barcode as variant_barcode,
      v.stock as variant_stock,
      v.reserved_stock as variant_reserved_stock,
      v.minimum_stock as variant_minimum_stock,
      v.cost_price as variant_cost_price,
      v.sale_price as variant_sale_price,
      v.is_active as variant_is_active,
      v.created_at as variant_created_at,
      v.updated_at as variant_updated_at
    from products p
    inner join categories c on c.id = p.category_id
    inner join providers pr on pr.id = p.provider_id
    left join product_variants v on v.product_id = p.id and v.is_active = 1
    ${where}
    order by p.created_at desc`,
    ...(id ? [id, user.id] : [user.id]),
  );
}

function groupProductRows(rows: ProductDetailsRow[]) {
  const grouped = new Map<string, ProductDetailsRow[]>();

  for (const row of rows) {
    const productRows = grouped.get(row.id) ?? [];
    productRows.push(row);
    grouped.set(row.id, productRows);
  }

  return Array.from(grouped.values())
    .map(toProductWithDetails)
    .filter((product): product is ProductWithDetails => product !== null);
}

export async function listProducts(
  searchTerm = "",
  filter: ProductStockFilter = "all",
  providerId?: string
) {
  const products = groupProductRows(await getProductRows());

  return products
    .filter((product) => {
      if (providerId && product.providerId !== providerId) {
        return false;
      }
      return matchesSearch(product, searchTerm);
    })
    .map(toProductListItem)
    .filter((product) => matchesStockFilter(product, filter));
}

export async function getProductDetails(id: string) {
  const product = toProductWithDetails(await getProductRows(id));

  if (!product) {
    return null;
  }

  return toProductListItem(product);
}

export async function createProductFromForm(values: ProductFormValues) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const productId = createId("product");

  await sqlite.withTransactionAsync(async () => {
    const category = await getOrCreateCategory("General");
    const provider = await getProviderById(values.providerId);
    const now = Date.now();

    await sqlite.runAsync(
      `insert into products
        (id, user_id, category_id, provider_id, name, description, is_active, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      productId,
      user.id,
      category.id,
      provider.id,
      normalizeName(values.name),
      null,
      1,
      now,
      now,
    );

    for (const variant of values.variants) {
      const variantPayload = toVariantPayload(productId, variant);
      await sqlite.runAsync(
        `insert into product_variants
          (id, product_id, color, size, model, sku, barcode, cost_price, sale_price, is_active, created_at, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        createId("variant"),
        productId,
        variantPayload.color,
        variantPayload.size,
        variantPayload.model,
        variantPayload.sku,
        variantPayload.barcode,
        variantPayload.costPrice,
        variantPayload.salePrice,
        1,
        now,
        now,
      );
    }
  });

  const product = await getProductDetails(productId);

  if (!product) {
    throw new Error("No se pudo cargar el producto creado.");
  }

  return product;
}

export async function updateProductFromForm(id: string, values: ProductFormValues) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();

  await sqlite.withTransactionAsync(async () => {
    const provider = await getProviderById(values.providerId);
    const now = Date.now();

    await sqlite.runAsync(
      "update products set name = ?, provider_id = ?, updated_at = ? where id = ? and user_id = ?",
      normalizeName(values.name),
      provider.id,
      now,
      id,
      user.id,
    );

    const product = await sqlite.getFirstAsync<{ id: string }>(
      "select id from products where id = ? and user_id = ?",
      id,
      user.id,
    );

    if (!product) {
      throw new Error("Producto no encontrado.");
    }

    const existingVariants = await sqlite.getAllAsync<{ id: string }>(
      "select id from product_variants where product_id = ?",
      id,
    );
    const submittedIds = new Set(values.variants.map((variant) => variant.id).filter(Boolean));

    for (const existingVariant of existingVariants) {
      if (!submittedIds.has(existingVariant.id)) {
        await sqlite.runAsync(
          "update product_variants set is_active = 0, updated_at = ? where id = ?",
          now,
          existingVariant.id,
        );
      }
    }

    for (const variant of values.variants) {
      const variantPayload = toVariantPayload(id, variant);

      if (variant.id) {
        await sqlite.runAsync(
          `update product_variants
          set color = ?, size = ?, model = ?, sku = ?, barcode = ?, cost_price = ?,
            sale_price = ?, is_active = 1, updated_at = ?
          where id = ?`,
          variantPayload.color,
          variantPayload.size,
          variantPayload.model,
          variantPayload.sku,
          variantPayload.barcode,
          variantPayload.costPrice,
          variantPayload.salePrice,
          now,
          variant.id,
        );
      } else {
        await sqlite.runAsync(
          `insert into product_variants
            (id, product_id, color, size, model, sku, barcode, cost_price, sale_price, is_active, created_at, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          createId("variant"),
          id,
          variantPayload.color,
          variantPayload.size,
          variantPayload.model,
          variantPayload.sku,
          variantPayload.barcode,
          variantPayload.costPrice,
          variantPayload.salePrice,
          1,
          now,
          now,
        );
      }
    }
  });

  const product = await getProductDetails(id);

  if (!product) {
    throw new Error("No se pudo cargar el producto actualizado.");
  }

  return product;
}

export async function deleteProduct(id: string) {
  const sqlite = await getSQLiteConnection();
  const existing = await getProductDetails(id);

  if (!existing) {
    throw new Error("El producto no existe o ya fue eliminado.");
  }

  await sqlite.withTransactionAsync(async () => {
    await sqlite.runAsync(
      `delete from order_items
      where product_variant_id in (
        select id from product_variants where product_id = ?
      )`,
      id,
    );
    await sqlite.runAsync(
      `delete from purchase_items
      where product_variant_id in (
        select id from product_variants where product_id = ?
      )`,
      id,
    );
    await sqlite.runAsync(
      "delete from product_variants where product_id = ?",
      id,
    );
    await sqlite.runAsync(
      "delete from products where id = ?",
      id,
    );
  });
}
