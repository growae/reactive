import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_TTL } from '../constants'
import { CallContractNoAccountError, callContract } from './callContract'

describe('callContract', () => {
  it('should be a function', () => {
    expect(typeof callContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(callContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw CallContractNoAccountError when no account and not static', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
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
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { current: undefined, connections: new Map() },
    }

    await expect(
      callContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'greet',
      }),
    ).rejects.toThrow()
  })

  it('should call connector.getProvider() for signing account, not use string address', async () => {
    const mockSigningAccount = { address: 'ak_test', sign: vi.fn() }
    const mockConnector = {
      getProvider: vi.fn().mockResolvedValue(mockSigningAccount),
    }
    const mockConnections = new Map([
      [
        'uid1',
        {
          activeAccount: 'ak_test',
          connector: mockConnector,
          networkId: 'ae_uat',
        },
      ],
    ])
    const mockConfig = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: 'uid1', connections: mockConnections },
    }

    // Contract.initialize will fail with mock node but getProvider must be called first
    await expect(
      callContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'greet',
      }),
    ).rejects.toThrow()

    expect(mockConnector.getProvider).toHaveBeenCalledOnce()
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
