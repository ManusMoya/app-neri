export function createId(prefix: string) {
  const randomUUID = globalThis.crypto?.randomUUID?.();

  if (randomUUID) {
    return `${prefix}_${randomUUID}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

