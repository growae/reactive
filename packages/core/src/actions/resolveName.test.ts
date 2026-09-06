import { describe, expect, it, vi } from 'vitest'
import { resolveName } from './resolveName.js'

describe('resolveName', () => {
  it('should be a function', () => {
    expect(typeof resolveName).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(resolveName.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      resolveName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow()
  })

  it('should resolve name to account address', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue({
        pointers: [{ key: 'account_pubkey', id: 'ak_resolved' }],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await resolveName(mockConfig as any, { name: 'test.chain' })
    expect(result).toBe('ak_resolved')
  })

  it('should return null when name not found', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockRejectedValue(new Error('Not found')),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await resolveName(mockConfig as any, {
      name: 'missing.chain',
    })
    expect(result).toBeNull()
  })

  it('should return null when pointer key not found', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue({
        pointers: [{ key: 'contract_pubkey', id: 'ct_test' }],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await resolveName(mockConfig as any, { name: 'test.chain' })
    expect(result).toBeNull()
  })

  it('should use custom key when provided', async () => {
    const mockNode = {
      getNameEntryByName: vi.fn().mockResolvedValue({
        pointers: [{ key: 'contract_pubkey', id: 'ct_found' }],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await resolveName(mockConfig as any, {
      name: 'test.chain',
      key: 'contract_pubkey',
    })
    expect(result).toBe('ct_found')
  })
})
