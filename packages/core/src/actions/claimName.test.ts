import { describe, expect, it } from 'vitest'
import { claimName } from './claimName.js'

describe('claimName', () => {
  it('should be a function', () => {
    expect(typeof claimName).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(claimName.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when no connected account', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: 'uid1',
      },
    }
    await expect(
      claimName(mockConfig as any, { name: 'test.chain', salt: 12345n }),
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
      claimName(mockConfig as any, { name: 'test.chain', salt: '12345' }),
    ).rejects.toThrow()
  })
})
