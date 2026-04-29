import type { Cache } from './types.js';

interface Entry {
  value: string;
  fetchedAt: number;
}

const globalStore = (() => {
  const g = globalThis as unknown as { __chainsightCache?: Map<string, Entry> };
  if (!g.__chainsightCache) g.__chainsightCache = new Map<string, Entry>();
  return g.__chainsightCache;
})();

export class MemoryCache implements Cache {
  private store: Map<string, Entry>;
  private ttlSeconds: number;

  constructor(ttlSeconds: number, store: Map<string, Entry> = globalStore) {
    this.ttlSeconds = ttlSeconds;
    this.store = store;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const ageSeconds = (Date.now() - entry.fetchedAt) / 1000;
    if (ageSeconds > this.ttlSeconds) {
      this.store.delete(key);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value: JSON.stringify(value),
      fetchedAt: Date.now(),
    });
  }

  clear(): void {
    this.store.clear();
  }
}
