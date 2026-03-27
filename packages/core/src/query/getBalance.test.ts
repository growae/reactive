import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '../createConfig'
import { testnet } from '../types/network'
import { getBalanceQueryKey, getBalanceQueryOptions } from './getBalance'

describe('getBalanceQueryKey', () => {
  it('should return a query key tuple', () => {
    const key = getBalanceQueryKey({ address: 'ak_test' })
    expect(key).toEqual(['getBalance', { address: 'ak_test' }])
  })

  it('should return default key without params', () => {
    const key = getBalanceQueryKey()
    expect(key).toEqual(['getBalance', {}])
  })

  it('should include all provided params', () => {
    const key = getBalanceQueryKey({
      address: 'ak_test',
      format: 'ae',
      networkId: 'ae_uat',
    })
    expect(key[0]).toBe('getBalance')
    expect(key[1]).toEqual({
      address: 'ak_test',
      format: 'ae',
      networkId: 'ae_uat',
    })
  })
})

describe('getBalanceQueryOptions', () => {
  it('should return options with queryKey and queryFn', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    const options = getBalanceQueryOptions(config, { address: 'ak_test' })

    expect(options.queryKey).toEqual(['getBalance', { address: 'ak_test' }])
    expect(typeof options.queryFn).toBe('function')
  })

  it('should be enabled when address is provided', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    const options = getBalanceQueryOptions(config, { address: 'ak_test' })
    expect(options.enabled).toBe(true)
  })

  it('should be disabled without address', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    const options = getBalanceQueryOptions(config)
    expect(options.enabled).toBe(false)
  })

  it('should be disabled with empty address', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    const options = getBalanceQueryOptions(config, { address: '' })
    expect(options.enabled).toBe(false)
  })
})
