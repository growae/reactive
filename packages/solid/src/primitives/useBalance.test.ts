import { describe, expect, it, vi } from 'vitest'
import { useBalance } from './useBalance.js'

describe('useBalance', () => {
  it('should be a function', () => {
    expect(typeof useBalance).toBe('function')
  })

  it('should accept parameters as Accessor', () => {
    const mockConfig = {
      _internal: { ssr: false },
      subscribe: vi.fn(() => vi.fn()),
      getState: vi.fn(() => ({
        status: 'disconnected',
        connections: new Map(),
        current: null,
        networkId: 'ae_uat',
      })),
    } as any

    expect(() => {
      useBalance(() => ({
        address: 'ak_test123',
        config: mockConfig,
      }))
    }).not.toThrow()
  })

  it('should return query result with expected shape', () => {
    const mockConfig = {
      _internal: { ssr: false },
      subscribe: vi.fn(() => vi.fn()),
      getState: vi.fn(() => ({
        status: 'disconnected',
        connections: new Map(),
        current: null,
        networkId: 'ae_uat',
      })),
    } as any

    const result = useBalance(() => ({
      address: 'ak_test123',
      config: mockConfig,
    }))
    expect(result).toBeDefined()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('isLoading')
    expect(result).toHaveProperty('isError')
    expect(result).toHaveProperty('isSuccess')
    expect(result).toHaveProperty('queryKey')
  })
})
