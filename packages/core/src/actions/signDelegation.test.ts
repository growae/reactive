import { describe, expect, it, vi } from 'vitest'
import { signDelegation } from './signDelegation'

describe('signDelegation', () => {
  it('should be a function', () => {
    expect(typeof signDelegation).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(signDelegation.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when no connector is found', async () => {
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map(),
        current: undefined,
      },
    }
    await expect(
      signDelegation(mockConfig as any, { delegation: {} }),
    ).rejects.toThrow(/No connector found/)
  })

  it('should throw if connector does not support delegation signing', async () => {
    const mockConnector = {
      name: 'test-connector',
    }
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map([['uid1', { connector: mockConnector }]]),
        current: 'uid1',
      },
    }

    await expect(
      signDelegation(mockConfig as any, { delegation: {} }),
    ).rejects.toThrow(/does not support delegation signing/)
  })

  it('should sign delegation using connector', async () => {
    const mockConnector = {
      name: 'test-connector',
      signDelegation: vi.fn().mockResolvedValue('signed_delegation'),
    }
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map([['uid1', { connector: mockConnector }]]),
        current: 'uid1',
      },
    }

    const result = await signDelegation(mockConfig as any, {
      delegation: { type: 'test' },
    })
    expect(result).toBe('signed_delegation')
    expect(mockConnector.signDelegation).toHaveBeenCalledWith(
      { type: 'test' },
      { networkId: 'ae_uat', onAccount: undefined },
    )
  })

  it('should use provided connector over current connection', async () => {
    const explicitConnector = {
      name: 'explicit',
      signDelegation: vi.fn().mockResolvedValue('signed_explicit'),
    }
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map(),
        current: undefined,
      },
    }

    const result = await signDelegation(mockConfig as any, {
      delegation: {},
      connector: explicitConnector as any,
    })
    expect(result).toBe('signed_explicit')
  })
})
