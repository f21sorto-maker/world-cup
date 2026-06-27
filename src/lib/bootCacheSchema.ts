import { BOOT_CACHE_SCHEMA_VERSION } from "./bootCacheVersion";

export { BOOT_CACHE_SCHEMA_VERSION };

/** Schema stamp fields written into every boot cache payload. */
export function bootCacheSchemaFields(): {
  version: typeof BOOT_CACHE_SCHEMA_VERSION;
  _schemaVersion: typeof BOOT_CACHE_SCHEMA_VERSION;
} {
  return {
    version: BOOT_CACHE_SCHEMA_VERSION,
    _schemaVersion: BOOT_CACHE_SCHEMA_VERSION,
  };
}

/** Accept legacy `version` or explicit `_schemaVersion` on read. */
export function matchesBootCacheSchema(parsed: Record<string, unknown>): boolean {
  const schema = parsed._schemaVersion ?? parsed.version;
  return schema === BOOT_CACHE_SCHEMA_VERSION;
}
