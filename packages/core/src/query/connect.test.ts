import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '../createConfig'
import { testnet } from '../types/network'
import { connectMutationOptions } from './connect'

describe('connectMutationOptions', () => {
  it('should return mutation options with mutationKey', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    const options = connectMutationOptions(config)
    expect(options.mutationKey).toEqual(['connect'])
  })

  it('should return mutation options with mutationFn', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    const options = connectMutationOptions(config)
    expect(typeof options.mutationFn).toBe('function')
  })
})
