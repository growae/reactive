import { describe, it, expect, vi } from 'vitest'
import { getAccount } from './getAccount.js'

describe('getAccount', () => {
  it('should be a function', () => {
    expect(typeof getAccount).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getAccount.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => { throw new Error('No node') }),
      state: { networkId: 'ae_uat' },
    }
    await expect(getAccount(mockConfig as any, { address: 'ak_test' })).rejects.toThrow()
  })

  it('should return account info from node', async () => {
    const mockNode = {
      getAccountByPubkey: vi.fn().mockResolvedValue({
        balance: 1000n,
        nonce: 5,
        id: 'ak_test',
        kind: 'basic',
        payable: true,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getAccount(mockConfig as any, { address: 'ak_test' })
    expect(result.balance).toBe('1000')
    expect(result.nonce).toBe(5)
    expect(result.id).toBe('ak_test')
    expect(result.kind).toBe('basic')
    expect(result.payable).toBe(true)
  })

  it('should query by height when provided', async () => {
    const mockNode = {
      getAccountByPubkeyAndHeight: vi.fn().mockResolvedValue({
        balance: 500n,
        nonce: 3,
        id: 'ak_test',
        kind: 'basic',
        payable: false,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await getAccount(mockConfig as any, { address: 'ak_test', height: 100 })
    expect(mockNode.getAccountByPubkeyAndHeight).toHaveBeenCalledWith('ak_test', 100)
  })

  it('should query by hash when provided', async () => {
    const mockNode = {
      getAccountByPubkeyAndHash: vi.fn().mockResolvedValue({
        balance: 500n,
        nonce: 3,
        id: 'ak_test',
        kind: 'basic',
        payable: false,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await getAccount(mockConfig as any, { address: 'ak_test', hash: 'kh_abc' })
    expect(mockNode.getAccountByPubkeyAndHash).toHaveBeenCalledWith('ak_test', 'kh_abc')
  })

  it('should default payable to false when undefined', async () => {
    const mockNode = {
      getAccountByPubkey: vi.fn().mockResolvedValue({
        balance: 0n,
        nonce: 0,
        id: 'ak_test',
        kind: 'basic',
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getAccount(mockConfig as any, { address: 'ak_test' })
    expect(result.payable).toBe(false)
  })
})
