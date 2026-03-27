import { describe, it, expect, vi } from 'vitest'
import { useConnect } from './useConnect.js'

describe('useConnect', () => {
  it('should be a function', () => {
    expect(typeof useConnect).toBe('function')
  })

  it('should accept config parameter', () => {
    const mockConfig = {
      _internal: { ssr: false },
      subscribe: vi.fn(() => vi.fn()),
      getState: vi.fn(() => ({
        status: 'disconnected',
        connections: new Map(),
        current: null,
        networkId: 'ae_uat',
      })),
      connectors: [],
    } as any

    expect(() => {
      useConnect(() => ({ config: mockConfig }))
    }).not.toThrow()
  })

  it('should return mutation object with expected methods', () => {
    const mockConfig = {
      _internal: { ssr: false },
      subscribe: vi.fn(() => vi.fn()),
      getState: vi.fn(() => ({
        status: 'disconnected',
        connections: new Map(),
        current: null,
        networkId: 'ae_uat',
      })),
      connectors: [],
    } as any

    const result = useConnect(() => ({ config: mockConfig }))
    expect(result).toBeDefined()
    expect(typeof result.mutate).toBe('function')
    expect(typeof result.mutateAsync).toBe('function')
    expect(typeof result.reset).toBe('function')
  })
})
