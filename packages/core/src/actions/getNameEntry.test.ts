import { describe, expect, it, vi } from 'vitest'
import { getNameEntry } from './getNameEntry'

describe('getNameEntry', () => {
  it('should be a function', () => {
    expect(typeof getNameEntry).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getNameEntry.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      getNameEntry(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow()
  })

  it('should return name entry from node', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue({
        id: 'nm_test',
        owner: 'ak_owner',
        pointers: [{ key: 'account_pubkey', id: 'ak_pointed' }],
        ttl: 50000,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getNameEntry(mockConfig as any, { name: 'test.chain' })
    expect(mockNode.getNameEntryByName).toHaveBeenCalledWith('test.chain')
    expect(result.id).toBe('nm_test')
    expect(result.owner).toBe('ak_owner')
    expect(result.pointers).toEqual([
      { key: 'account_pubkey', id: 'ak_pointed' },
    ])
    expect(result.ttl).toBe(50000)
  })

  it('should handle empty pointers', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue({
        id: 'nm_test',
        owner: 'ak_owner',
        ttl: 50000,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getNameEntry(mockConfig as any, {
      name: 'empty.chain',
    })
    expect(result.pointers).toEqual([])
  })
})
