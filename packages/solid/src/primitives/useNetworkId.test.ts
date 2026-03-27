import { describe, it, expect, vi } from 'vitest'
import { useNetworkId } from './useNetworkId.js'

describe('useNetworkId', () => {
  it('should be a function', () => {
    expect(typeof useNetworkId).toBe('function')
  })

  it('should return an Accessor when given config', () => {
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

    const networkId = useNetworkId(() => ({ config: mockConfig }))
    expect(typeof networkId).toBe('function')
  })

  it('should return the current network id', () => {
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

    const networkId = useNetworkId(() => ({ config: mockConfig }))
    expect(networkId()).toBe('ae_uat')
  })
})
