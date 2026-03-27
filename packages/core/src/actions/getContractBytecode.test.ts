import { describe, expect, it, vi } from 'vitest'
import { getContractBytecode } from './getContractBytecode'

describe('getContractBytecode', () => {
  it('should be a function', () => {
    expect(typeof getContractBytecode).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getContractBytecode.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      getContractBytecode(mockConfig as any, { address: 'ct_test' }),
    ).rejects.toThrow()
  })

  it('should return bytecode from node', async () => {
    const mockNode = {
      getContractCode: vi.fn().mockResolvedValue({
        bytecode: 'cb_bytecode123',
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getContractBytecode(mockConfig as any, {
      address: 'ct_test',
    })
    expect(mockNode.getContractCode).toHaveBeenCalledWith('ct_test')
    expect(result.bytecode).toBe('cb_bytecode123')
  })

  it('should default bytecode to empty string when undefined', async () => {
    const mockNode = {
      getContractCode: vi.fn().mockResolvedValue({}),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getContractBytecode(mockConfig as any, {
      address: 'ct_test',
    })
    expect(result.bytecode).toBe('')
  })
})
