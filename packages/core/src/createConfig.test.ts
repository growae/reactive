import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation((url: string) => ({ url })),
}))

import { mock } from './connectors/mock.js'
import { createConfig } from './createConfig.js'
import { mainnet, testnet } from './types/network.js'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

describe('createConfig', () => {
  it('should create config with networks', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    expect(config.networks).toEqual([testnet])
  })

  it('should create config with multiple networks', () => {
    const config = createConfig({
      networks: [testnet, mainnet],
      storage: null,
    })
    expect(config.networks).toHaveLength(2)
    expect(config.networks[0]).toEqual(testnet)
    expect(config.networks[1]).toEqual(mainnet)
  })

  it('should create config with connectors', () => {
    const config = createConfig({
      networks: [testnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    expect(config.connectors).toHaveLength(1)
    expect(config.connectors[0]!.id).toBe('mock')
    expect(config.connectors[0]!.name).toBe('Mock Connector')
  })

  it('should accept null storage', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    expect(config.storage).toBeNull()
  })

  describe('initial state', () => {
    it('should be disconnected', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      expect(config.state.status).toBe('disconnected')
    })

    it('should have no current connection', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      expect(config.state.current).toBeNull()
    })

    it('should have empty connections', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      expect(config.state.connections.size).toBe(0)
    })

    it('should default networkId to first network', () => {
      const config = createConfig({
        networks: [testnet, mainnet],
        storage: null,
      })
      expect(config.state.networkId).toBe('ae_uat')
    })
  })

  describe('setState', () => {
    it('should update state with an object', () => {
      const config = createConfig({
        networks: [testnet, mainnet],
        storage: null,
      })
      config.setState({ ...config.state, networkId: 'ae_mainnet' })
      expect(config.state.networkId).toBe('ae_mainnet')
    })

    it('should update state with a function', () => {
      const config = createConfig({
        networks: [testnet, mainnet],
        storage: null,
      })
      config.setState((prev) => ({ ...prev, networkId: 'ae_mainnet' }))
      expect(config.state.networkId).toBe('ae_mainnet')
    })

    it('should reset state when given invalid value', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      config.setState('invalid' as any)
      expect(config.state.status).toBe('disconnected')
    })
  })

  describe('subscribe', () => {
    it('should notify on state changes', () => {
      const config = createConfig({
        networks: [testnet, mainnet],
        storage: null,
      })
      const fn = vi.fn()
      config.subscribe((s) => s.networkId, fn)

      config.setState((s) => ({ ...s, networkId: 'ae_mainnet' }))
      expect(fn).toHaveBeenCalledWith('ae_mainnet', 'ae_uat')
    })

    it('should return unsubscribe function', () => {
      const config = createConfig({
        networks: [testnet, mainnet],
        storage: null,
      })
      const fn = vi.fn()
      const unsub = config.subscribe((s) => s.networkId, fn)

      unsub()
      config.setState((s) => ({ ...s, networkId: 'ae_mainnet' }))
      expect(fn).not.toHaveBeenCalled()
    })

    it('should not notify when selected value has not changed', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      const fn = vi.fn()
      config.subscribe((s) => s.networkId, fn)

      config.setState((s) => ({ ...s, status: 'connecting' as const }))
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('getNodeClient', () => {
    it('should return a node client', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      const node = config.getNodeClient()
      expect(node).toBeDefined()
    })

    it('should cache clients by networkId', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      const node1 = config.getNodeClient()
      const node2 = config.getNodeClient()
      expect(node1).toBe(node2)
    })

    it('should create different clients for different networks', () => {
      const config = createConfig({
        networks: [testnet, mainnet],
        storage: null,
      })
      const node1 = config.getNodeClient({ networkId: 'ae_uat' })
      const node2 = config.getNodeClient({ networkId: 'ae_mainnet' })
      expect(node1).not.toBe(node2)
    })

    it('should throw for unconfigured networkId', () => {
      const config = createConfig({ networks: [testnet], storage: null })
      expect(() => config.getNodeClient({ networkId: 'invalid_net' })).toThrow(
        'Network not configured',
      )
    })
  })
})
