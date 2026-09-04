// SQLite has no native array/JSON column type, so list-ish fields on User /
// ClothingItem / Outfit are stored as JSON strings. These helpers keep the
// parse/stringify calls out of route handlers and components.

export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyList(value: string[] | undefined | null): string {
  return JSON.stringify(value ?? []);
}

export function parseObject<T extends Record<string, unknown>>(
  value: string | null | undefined,
  fallback: T
): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}
