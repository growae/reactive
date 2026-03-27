import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  hashTypedData: vi.fn().mockReturnValue(Buffer.from('mockhash', 'utf8')),
}))

import { signTypedData } from './signTypedData.js'

describe('signTypedData', () => {
  it('should be a function', () => {
    expect(typeof signTypedData).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(signTypedData.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when no connected account', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    }
    await expect(
      signTypedData(mockConfig as any, {
        domain: {},
        aci: {},
        data: 'test',
      }),
    ).rejects.toThrow(/No connected account/)
  })

  it('should throw if connector does not support signMessage', async () => {
    const mockConnector = {}
    const mockConfig = {
      state: {
        connections: new Map([['uid1', { connector: mockConnector, accounts: ['ak_test'] }]]),
        current: 'uid1',
      },
    }

    await expect(
      signTypedData(mockConfig as any, {
        domain: {},
        aci: {},
        data: 'test',
      }),
    ).rejects.toThrow(/does not support message signing/)
  })

  it('should hash data and sign using connector', async () => {
    const mockConnector = {
      signMessage: vi.fn().mockResolvedValue('sig_hex'),
    }
    const mockConfig = {
      state: {
        connections: new Map([['uid1', { connector: mockConnector, accounts: ['ak_test'] }]]),
        current: 'uid1',
      },
    }

    const result = await signTypedData(mockConfig as any, {
      domain: { name: 'test' },
      aci: {},
      data: 'hello',
    })
    expect(result.signature).toBe('sig_hex')
    expect(mockConnector.signMessage).toHaveBeenCalledWith(
      expect.objectContaining({ onAccount: 'ak_test' }),
    )
  })
})
