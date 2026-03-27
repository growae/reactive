import { describe, expect, it, vi } from 'vitest'
import { useNetworkId } from './useNetworkId'

function createMockConfig() {
  return {
    _internal: { ssr: false },
    state: {
      networkId: 'ae_uat',
      status: 'disconnected',
      connections: new Map(),
      current: null,
    },
    subscribe: vi.fn(() => vi.fn()),
    getState: vi.fn(() => ({
      status: 'disconnected',
      connections: new Map(),
      current: null,
      networkId: 'ae_uat',
    })),
  } as any
}

describe('useNetworkId', () => {
  it('should be a function', () => {
    expect(typeof useNetworkId).toBe('function')
  })

  it('should return an Accessor when given config', () => {
    const mockConfig = createMockConfig()
    const networkId = useNetworkId(() => ({ config: mockConfig }))
    expect(typeof networkId).toBe('function')
  })

  it('should return the current network id', () => {
    const mockConfig = createMockConfig()
    const networkId = useNetworkId(() => ({ config: mockConfig }))
    expect(networkId()).toBe('ae_uat')
  })
})
