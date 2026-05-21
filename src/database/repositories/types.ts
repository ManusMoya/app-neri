import type { Database } from "../drizzle";

// Drizzle's Expo transaction type is structurally compatible with the database
// query surface but very expensive for TypeScript to infer in app code.
export type RepositoryDatabase = Database;
