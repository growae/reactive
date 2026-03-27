import { describe, it, expect, vi } from 'vitest'
import { callContract, CallContractNoAccountError } from './callContract.js'
import { DEFAULT_TTL } from '../constants.js'

describe('callContract', () => {
  it('should be a function', () => {
    expect(typeof callContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(callContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw CallContractNoAccountError when no account and not static', async () => {
    const mockConfig = {
      getNode: vi.fn(() => ({})),
      state: { current: undefined },
    }

    await expect(
      callContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'greet',
      }),
    ).rejects.toThrow(CallContractNoAccountError)
  })

  it('should throw when getNode fails', async () => {
    const mockConfig = {
      getNode: vi.fn(() => { throw new Error('No node') }),
      state: { current: undefined },
    }

    await expect(
      callContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'greet',
      }),
    ).rejects.toThrow()
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
