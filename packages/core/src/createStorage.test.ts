import { describe, it, expect } from 'vitest'
import { createStorage, noopStorage } from './createStorage.js'
import { createMemoryBaseStorage } from '../test/utils.js'

describe('noopStorage', () => {
  it('should return null for getItem', () => {
    expect(noopStorage.getItem('any')).toBeNull()
  })

  it('should not throw on setItem', () => {
    expect(() => noopStorage.setItem('key', 'val')).not.toThrow()
  })

  it('should not throw on removeItem', () => {
    expect(() => noopStorage.removeItem('key')).not.toThrow()
  })
})

describe('createStorage', () => {
  it('should use default prefix "reactive"', () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ storage: base })
    expect(storage.key).toBe('reactive')
  })

  it('should use custom prefix', () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ key: 'myapp', storage: base })
    expect(storage.key).toBe('myapp')
  })

  it('should set and get items', async () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ storage: base })

    await storage.setItem('recentConnectorId', 'mock')
    const result = await storage.getItem('recentConnectorId')
    expect(result).toBe('mock')
  })

  it('should prefix keys in underlying storage', async () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ key: 'test', storage: base })

    await storage.setItem('recentConnectorId', 'mock')
    expect(base.getItem('test.recentConnectorId')).not.toBeNull()
  })

  it('should return default value for missing items', async () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ storage: base })

    const result = await storage.getItem('recentConnectorId', 'default-val' as any)
    expect(result).toBe('default-val')
  })

  it('should return null for missing items without default', async () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ storage: base })

    const result = await storage.getItem('recentConnectorId', null)
    expect(result).toBeNull()
  })

  it('should remove items', async () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ storage: base })

    await storage.setItem('recentConnectorId', 'mock')
    await storage.removeItem('recentConnectorId')
    const result = await storage.getItem('recentConnectorId', null)
    expect(result).toBeNull()
  })

  it('should remove item when set to null', async () => {
    const base = createMemoryBaseStorage()
    const storage = createStorage({ storage: base })

    await storage.setItem('recentConnectorId', 'mock')
    await storage.setItem('recentConnectorId', null as any)
    const result = await storage.getItem('recentConnectorId', null)
    expect(result).toBeNull()
  })

  it('should use noopStorage by default', async () => {
    const storage = createStorage({})
    const result = await storage.getItem('recentConnectorId', null)
    expect(result).toBeNull()
  })
})
