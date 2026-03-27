import { describe, it, expect, vi } from 'vitest'
import {
  deployContract,
  DeployContractNoCodeError,
  DeployContractNoAccountError,
} from './deployContract.js'
import { DEFAULT_TTL } from '../constants.js'

describe('deployContract', () => {
  it('should be a function', () => {
    expect(typeof deployContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(deployContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw DeployContractNoCodeError without sourceCode or bytecode', async () => {
    const mockConfig = {
      getNode: vi.fn(() => ({})),
      state: { current: { account: 'ak_test' } },
    }

    await expect(
      deployContract(mockConfig as any, {}),
    ).rejects.toThrow(DeployContractNoCodeError)
  })

  it('should throw DeployContractNoAccountError without connected account', async () => {
    const mockConfig = {
      getNode: vi.fn(() => ({})),
      state: { current: undefined },
    }

    await expect(
      deployContract(mockConfig as any, { sourceCode: 'contract Test = ...' }),
    ).rejects.toThrow(DeployContractNoAccountError)
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
