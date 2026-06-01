const COLLATOR = new Intl.Collator("es-AR", {
  numeric: true,
  sensitivity: "base",
});

export function compareText(a?: string | null, b?: string | null) {
  return COLLATOR.compare(a?.trim() ?? "", b?.trim() ?? "");
}

export function sortByText<T>(items: T[], selector: (item: T) => string | null | undefined) {
  return [...items].sort((a, b) => compareText(selector(a), selector(b)));
}

export function compareDatesDesc(a?: Date | null, b?: Date | null) {
  return (b?.getTime() ?? 0) - (a?.getTime() ?? 0);
}
