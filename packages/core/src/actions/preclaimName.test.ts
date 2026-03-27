import { describe, it, expect, vi } from 'vitest'
import { preclaimName } from './preclaimName.js'

describe('preclaimName', () => {
  it('should be a function', () => {
    expect(typeof preclaimName).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(preclaimName.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when no connected account', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: 'uid1',
      },
    }
    await expect(
      preclaimName(mockConfig as any, { name: 'test.chain' }),
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
      preclaimName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow()
  })
})
