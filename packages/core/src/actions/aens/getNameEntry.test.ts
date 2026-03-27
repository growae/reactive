import { describe, expect, it, vi } from 'vitest'
import { getNameEntry } from './getNameEntry.js'

describe('getNameEntry', () => {
  it('should be a function', () => {
    expect(typeof getNameEntry).toBe('function')
  })

  it('should call node.getNameEntryByName with the name', async () => {
    const mockEntry = {
      id: 'nm_test',
      owner: 'ak_owner',
      ttl: 50000,
      pointers: [{ key: 'account_pubkey', id: 'ak_pointer' }],
    }
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue(mockEntry),
    }
    const mockConfig = {
      getNode: vi.fn().mockReturnValue(mockNode),
    }

    const result = await getNameEntry(mockConfig as any, { name: 'test.chain' })

    expect(mockNode.getNameEntryByName).toHaveBeenCalledWith('test.chain')
    expect(result.id).toBe('nm_test')
    expect(result.owner).toBe('ak_owner')
    expect(result.ttl).toBe(50000)
    expect(result.pointers).toEqual([
      { key: 'account_pubkey', id: 'ak_pointer' },
    ])
  })

  it('should map pointers correctly', async () => {
    const mockEntry = {
      id: 'nm_test',
      owner: 'ak_owner',
      ttl: 100,
      pointers: [
        { key: 'account_pubkey', id: 'ak_1', extra: 'ignored' },
        { key: 'contract_pubkey', id: 'ct_2', extra: 'ignored' },
      ],
    }
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue(mockEntry),
    }
    const mockConfig = { getNode: vi.fn().mockReturnValue(mockNode) }

    const result = await getNameEntry(mockConfig as any, { name: 'x.chain' })

    expect(result.pointers).toHaveLength(2)
    expect(result.pointers[0]).toEqual({ key: 'account_pubkey', id: 'ak_1' })
    expect(result.pointers[1]).toEqual({ key: 'contract_pubkey', id: 'ct_2' })
  })
})
