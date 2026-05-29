import { getSQLiteConnection } from "@/database";
import type { Provider } from "@/database/schema";
import { buildWhatsappLink, normalizePhone } from "@/modules/clients/utils/phone";
import type { ProviderFormValues } from "@/modules/providers/types";
import { createId } from "@/utils/ids";
import { sortByText } from "@/utils/sort";
import { requireCurrentUser } from "./auth.service";

export interface ProviderDetails {
  provider: Provider;
  products: ProviderProductSummary[];
  productsCount: number;
  purchasesCount: number;
}

export interface ProviderProductSummary {
  id: string;
  name: string;
  description: string | null;
  stockTotal: number;
}

const DELETED_PROVIDER_ID = "provider_deleted";
const DELETED_PROVIDER_NAME = "Proveedor eliminado";

function getDeletedProviderId(userId: string) {
  return `${DELETED_PROVIDER_ID}_${userId}`;
}

type ProviderRow = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp_link: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

type ProviderProductRow = {
  id: string;
  name: string;
  description: string | null;
  stock_total: number | null;
};

function mapProviderRow(row: ProviderRow): Provider {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsappLink: row.whatsapp_link,
    email: row.email,
    address: row.address,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function nullableText(value?: string | null) {
  const normalized = value?.trim() ?? "";

  return normalized.length > 0 ? normalized : null;
}

function toProviderPayload(values: ProviderFormValues) {
  const phone = normalizePhone(values.phone);

  return {
    name: values.name.trim(),
    phone,
    whatsappLink: buildWhatsappLink(phone),
    email: nullableText(values.email),
    address: nullableText(values.address),
    notes: nullableText(values.notes),
    updatedAt: new Date(),
  };
}

export async function listProviders(searchTerm = "") {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const deletedProviderId = getDeletedProviderId(user.id);
  const normalized = searchTerm.trim();

  if (!normalized) {
    const rows = await sqlite.getAllAsync<ProviderRow>(
      "select * from providers where user_id = ? and id != ? and id != ? order by created_at desc",
      user.id,
      deletedProviderId,
      DELETED_PROVIDER_ID,
    );

    return sortByText(rows.map(mapProviderRow), (provider) => provider.name);
  }

  const pattern = `%${normalized}%`;
  const rows = await sqlite.getAllAsync<ProviderRow>(
    `select * from providers
      where user_id = ? and id != ? and id != ? and (name like ? or phone like ? or email like ?)
      order by created_at desc`,
    user.id,
    deletedProviderId,
    DELETED_PROVIDER_ID,
    pattern,
    pattern,
    pattern,
  );

  return sortByText(rows.map(mapProviderRow), (provider) => provider.name);
}

export async function getProviderDetails(id: string): Promise<ProviderDetails | null> {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const providerRow = await sqlite.getFirstAsync<ProviderRow>(
    "select * from providers where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!providerRow) {
    return null;
  }

  const products = await sqlite.getAllAsync<ProviderProductRow>(
    `select
      products.id,
      products.name,
      products.description,
      coalesce(sum(product_variants.stock), 0) as stock_total
    from products
    left join product_variants on product_variants.product_id = products.id
    where products.provider_id = ? and products.user_id = ? and products.is_active = 1
    group by products.id
    order by products.name asc`,
    id,
    user.id,
  );
  const purchasesCountRow = await sqlite.getFirstAsync<{ count: number }>(
    "select count(id) as count from purchases where provider_id = ? and user_id = ?",
    id,
    user.id,
  );

  return {
    provider: mapProviderRow(providerRow),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      stockTotal: product.stock_total ?? 0,
    })),
    productsCount: products.length,
    purchasesCount: purchasesCountRow?.count ?? 0,
  };
}

export async function createProviderFromForm(values: ProviderFormValues) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const payload = toProviderPayload(values);
  const id = createId("provider");
  const now = Date.now();

  await sqlite.runAsync(
    `insert into providers
      (id, user_id, name, phone, whatsapp_link, email, address, notes, created_at, updated_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    user.id,
    payload.name,
    payload.phone,
    payload.whatsappLink,
    payload.email,
    payload.address,
    payload.notes,
    now,
    now,
  );

  const row = await sqlite.getFirstAsync<ProviderRow>(
    "select * from providers where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!row) {
    throw new Error("No se pudo cargar el proveedor creado.");
  }

  return mapProviderRow(row);
}

export async function updateProviderFromForm(id: string, values: ProviderFormValues) {
  const sqlite = await getSQLiteConnection();
  const user = requireCurrentUser();
  const payload = toProviderPayload(values);
  const now = Date.now();

  await sqlite.runAsync(
    `update providers
    set name = ?, phone = ?, whatsapp_link = ?, email = ?, address = ?, notes = ?, updated_at = ?
    where id = ? and user_id = ?`,
    payload.name,
    payload.phone,
    payload.whatsappLink,
    payload.email,
    payload.address,
    payload.notes,
    now,
    id,
    user.id,
  );

  const row = await sqlite.getFirstAsync<ProviderRow>(
    "select * from providers where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!row) {
    throw new Error("Proveedor no encontrado.");
  }

  return mapProviderRow(row);
}

export async function removeProvider(id: string) {
  const user = requireCurrentUser();
  const deletedProviderId = getDeletedProviderId(user.id);

  if (id === deletedProviderId || id === DELETED_PROVIDER_ID) {
    throw new Error("No se puede eliminar el proveedor tecnico.");
  }

  const sqlite = await getSQLiteConnection();
  const provider = await sqlite.getFirstAsync<{ id: string }>(
    "select id from providers where id = ? and user_id = ?",
    id,
    user.id,
  );

  if (!provider) {
    throw new Error("Proveedor no encontrado.");
  }

  const usage = await getProviderDetails(id);

  if (!usage) {
    throw new Error("Proveedor no encontrado.");
  }

  if (usage.purchasesCount > 0) {
    throw new Error("No se puede eliminar un proveedor con compras asociadas.");
  }

  await sqlite.withTransactionAsync(async () => {
    const now = Date.now();

    try {
      await sqlite.runAsync(
        `insert or ignore into providers
          (id, user_id, name, phone, whatsapp_link, email, address, notes, created_at, updated_at)
        values (?, ?, ?, null, null, null, null, null, ?, ?)`,
        deletedProviderId,
        user.id,
        DELETED_PROVIDER_NAME,
        now,
        now,
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `No se pudo preparar el proveedor destino: ${error.message}`
          : "No se pudo preparar el proveedor destino.",
      );
    }

    try {
      await sqlite.runAsync(
        "update products set provider_id = ?, updated_at = ? where provider_id = ? and user_id = ?",
        deletedProviderId,
        now,
        id,
        user.id,
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `No se pudieron reasignar los productos: ${error.message}`
          : "No se pudieron reasignar los productos.",
      );
    }

    try {
      await sqlite.runAsync("delete from providers where id = ? and user_id = ?", id, user.id);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `No se pudo eliminar el proveedor: ${error.message}`
          : "No se pudo eliminar el proveedor.",
      );
    }
  });
}
