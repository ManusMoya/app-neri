import type { Category } from "@/database/schema";
import { createId } from "@/utils/ids";
import { apiRequest, fromTimestamp } from "./api-client";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: number | string;
  updated_at: number | string;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: fromTimestamp(row.created_at),
    updatedAt: fromTimestamp(row.updated_at),
  };
}

export async function listCategories(searchTerm = "") {
  const query = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : "";
  const rows = await apiRequest<CategoryRow[]>(`/categories${query}`);
  return rows.map(mapCategory);
}

export async function getCategory(id: string) {
  const row = await apiRequest<CategoryRow>(`/categories/${encodeURIComponent(id)}`);
  return mapCategory(row);
}

export async function createCategory(input: { name: string; description?: string | null }) {
  const row = await apiRequest<CategoryRow>("/categories", {
    method: "POST",
    body: JSON.stringify({ id: createId("category"), ...input }),
  });
  return mapCategory(row);
}

export async function updateCategory(id: string, input: Partial<{ name: string; description: string | null }>) {
  const row = await apiRequest<CategoryRow>(`/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return mapCategory(row);
}

export async function deleteCategory(id: string) {
  const row = await apiRequest<CategoryRow>(`/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return mapCategory(row);
}
