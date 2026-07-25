const storeKey = Symbol.for("astro-og-seo.server-images");
const maxEntries = 256;

type ImageStore = Map<string, Uint8Array>;

function getStore() {
  const globals = globalThis as typeof globalThis & {
    [storeKey]?: ImageStore;
  };

  return (globals[storeKey] ??= new Map());
}

export function cacheServerOgImage(pathname: string, image: Uint8Array) {
  const store = getStore();
  store.delete(pathname);
  store.set(pathname, image);

  while (store.size > maxEntries) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function getServerOgImage(pathname: string) {
  return getStore().get(pathname);
}
