export function toIsoDate(value: Date | string | undefined, name: string, pathname: string) {
  if (value === undefined) return undefined;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`astro-og-seo: invalid ${name} on ${pathname}`);
  }

  return date.toISOString();
}
