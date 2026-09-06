import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockNode } = vi.hoisted(() => ({
  mockNode: {
    getAccountByPubkey: vi.fn(),
  },
}))

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => mockNode),
}))

import { createConfig } from '../createConfig.js'
import { testnet } from '../types/network.js'
import { getBalance } from './getBalance.js'

function createTestConfig() {
  return createConfig({ networks: [testnet], storage: null })
}

describe('getBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return balance in aettos by default', async () => {
    mockNode.getAccountByPubkey.mockResolvedValue({
      balance: '5000000000000000000',
    })

    const config = createTestConfig()
    const result = await getBalance(config, {
      address: 'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
    })
    expect(result).toBe('5000000000000000000')
  })

  it('should return balance in AE when format is "ae"', async () => {
    mockNode.getAccountByPubkey.mockResolvedValue({
      balance: '5000000000000000000',
    })

    const config = createTestConfig()
    const result = await getBalance(config, {
      address: 'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
      format: 'ae',
    })
    expect(result).toBe('5')
  })

  it('should return zero balance for unknown accounts (404)', async () => {
    mockNode.getAccountByPubkey.mockRejectedValue({ statusCode: 404 })

    const config = createTestConfig()
    const result = await getBalance(config, { address: 'ak_unknown' })
    expect(result).toBe('0')
  })

  it('should handle 404 via response.status', async () => {
    mockNode.getAccountByPubkey.mockRejectedValue({
      response: { status: 404 },
    })

    const config = createTestConfig()
    const result = await getBalance(config, { address: 'ak_new' })
    expect(result).toBe('0')
  })

  it('should rethrow non-404 errors', async () => {
    mockNode.getAccountByPubkey.mockRejectedValue(new Error('Network error'))

    const config = createTestConfig()
    await expect(getBalance(config, { address: 'ak_test' })).rejects.toThrow(
      'Network error',
    )
  })

  it('should return fractional AE value', async () => {
    mockNode.getAccountByPubkey.mockResolvedValue({
      balance: '1500000000000000000',
    })

    const config = createTestConfig()
    const result = await getBalance(config, {
      address: 'ak_test',
      format: 'ae',
    })
    expect(result).toBe('1.5')
  })

  it('should call getAccountByPubkey with the address', async () => {
    mockNode.getAccountByPubkey.mockResolvedValue({ balance: '0' })

    const config = createTestConfig()
    const address = 'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM'
    await getBalance(config, { address })
    expect(mockNode.getAccountByPubkey).toHaveBeenCalledWith(address)
  })
})
