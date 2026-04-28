/**
 * Test setup for game/* tests.
 *
 * @adobe/data blob-store calls globalThis.caches.open() at import time (Cache API).
 * Node.js does not have the Cache API, so we provide a no-op stub to prevent
 * the unhandled rejection in test environments.
 */

// Minimal Cache API stub — no-op implementation for Node test environment
if (typeof globalThis.caches === 'undefined') {
  const noop = async () => ({
    match: async () => undefined,
    put: async () => {},
    delete: async () => false,
    keys: async () => [],
    has: async () => false,
    add: async () => {},
    addAll: async () => {},
  });

  (globalThis as any).caches = {
    open: noop,
    delete: async () => false,
    has: async () => false,
    keys: async () => [],
    match: async () => undefined,
  };
}
