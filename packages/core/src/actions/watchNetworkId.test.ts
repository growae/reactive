import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '../createConfig.js'
import { mainnet, testnet } from '../types/network.js'
import { watchNetworkId } from './watchNetworkId.js'

describe('watchNetworkId', () => {
  it('should call onChange when networkId changes', () => {
    const config = createConfig({
      networks: [testnet, mainnet],
      storage: null,
    })
    const onChange = vi.fn()

    watchNetworkId(config, { onChange })
    config.setState((s) => ({ ...s, networkId: 'ae_mainnet' }))

    expect(onChange).toHaveBeenCalledWith('ae_mainnet', 'ae_uat')
  })

  it('should return an unsubscribe function', () => {
    const config = createConfig({
      networks: [testnet, mainnet],
      storage: null,
    })
    const onChange = vi.fn()

    const unsubscribe = watchNetworkId(config, { onChange })
    unsubscribe()

    config.setState((s) => ({ ...s, networkId: 'ae_mainnet' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('should not fire when networkId stays the same', () => {
    const config = createConfig({
      networks: [testnet, mainnet],
      storage: null,
    })
    const onChange = vi.fn()

    watchNetworkId(config, { onChange })
    config.setState((s) => ({ ...s, status: 'connecting' as const }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
