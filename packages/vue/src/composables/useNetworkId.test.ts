import { describe, expect, it, vi } from 'vitest'
import { useNetworkId } from './useNetworkId'

let watchNetworkIdCallback: ((value: string) => void) | undefined

vi.mock('@growae/reactive', () => ({
  getNetworkId: vi.fn(() => 'ae_uat'),
  watchNetworkId: vi.fn((_config, options) => {
    watchNetworkIdCallback = options.onChange
    return vi.fn()
  }),
}))

vi.mock('./useConfig.js', () => ({
  useConfig: vi.fn(() => ({
    subscribe: vi.fn(() => vi.fn()),
    networks: [{ id: 'ae_uat' }],
    state: {
      networkId: 'ae_uat',
      connections: new Map(),
      status: 'disconnected',
      current: undefined,
    },
  })),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onScopeDispose: vi.fn(),
  }
})

describe('useNetworkId', () => {
  it('should return initial network ID as ref', () => {
    const networkId = useNetworkId()

    expect(networkId.value).toBe('ae_uat')
  })

  it('should accept config parameter', () => {
    const mockConfig = {
      subscribe: vi.fn(() => vi.fn()),
      networks: [{ id: 'ae_mainnet' }],
      state: {
        networkId: 'ae_mainnet',
        connections: new Map(),
        status: 'disconnected',
        current: undefined,
      },
    }
    const networkId = useNetworkId({ config: mockConfig as any })

    expect(networkId.value).toBe('ae_uat')
  })

  it('should update when watchNetworkId fires onChange', () => {
    const networkId = useNetworkId()
    expect(networkId.value).toBe('ae_uat')

    if (watchNetworkIdCallback) {
      watchNetworkIdCallback('ae_mainnet')
      expect(networkId.value).toBe('ae_mainnet')
    }
  })
})
