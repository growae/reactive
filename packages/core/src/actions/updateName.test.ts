import { describe, expect, it } from 'vitest'
import { updateName } from './updateName.js'

describe('updateName', () => {
  it('should be a function', () => {
    expect(typeof updateName).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(updateName.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when no connected account', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: 'uid1',
      },
    }
    await expect(
      updateName(mockConfig as any, {
        nameId: 'nm_test',
        pointers: [{ key: 'account_pubkey', id: 'ak_test' }],
      }),
    ).rejects.toThrow(/No connected account/)
  })

  it('should throw when current is undefined', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    }
    await expect(
      updateName(mockConfig as any, {
        nameId: 'nm_test',
        pointers: [],
      }),
    ).rejects.toThrow()
  })
})
