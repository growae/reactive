import type { BaseStorage } from '../src/createStorage.js'

export const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
  'ak_wMd5Yco4BDvRH7MJJSExXkRrFxJ27BaFiDR1nTjJPFp5Rnw4V',
] as const

export function createMemoryBaseStorage(): BaseStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}
