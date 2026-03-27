import { describe, expect, it, vi } from 'vitest'
import { NameNotResolvedError, resolveName } from './resolveName.js'

describe('resolveName', () => {
  it('should be a function', () => {
    expect(typeof resolveName).toBe('function')
  })

  it('should resolve a name to an address', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue({
        pointers: [{ key: 'account_pubkey', id: 'ak_resolved' }],
      }),
    }
    const mockConfig = { getNode: vi.fn().mockReturnValue(mockNode) }

    const result = await resolveName(mockConfig as any, { name: 'test.chain' })

    expect(result.address).toBe('ak_resolved')
  })

  it('should return undefined when pointer key not found', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue({
        pointers: [{ key: 'contract_pubkey', id: 'ct_other' }],
      }),
    }
    const mockConfig = { getNode: vi.fn().mockReturnValue(mockNode) }

    const result = await resolveName(mockConfig as any, { name: 'test.chain' })

    expect(result.address).toBeUndefined()
  })

  it('should throw NameNotResolvedError when node rejects', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockRejectedValue(new Error('not found')),
    }
    const mockConfig = { getNode: vi.fn().mockReturnValue(mockNode) }

    await expect(
      resolveName(mockConfig as any, { name: 'missing.chain' }),
    ).rejects.toThrow(NameNotResolvedError)
  })

  it('should have correct error name and message', () => {
    const error = new NameNotResolvedError({ name: 'foo.chain' })
    expect(error.name).toBe('NameNotResolvedError')
    expect(error.message).toContain('foo.chain')
  })
})
