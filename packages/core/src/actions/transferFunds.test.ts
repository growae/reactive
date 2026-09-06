import { describe, expect, it } from 'vitest'
import { DEFAULT_TTL } from '../constants.js'
import { transferFunds } from './transferFunds.js'

describe('transferFunds', () => {
  it('should be a function', () => {
    expect(typeof transferFunds).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(transferFunds.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when fraction is less than 0', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    } as any

    await expect(
      transferFunds(mockConfig, { fraction: -0.5, recipient: 'ak_test' }),
    ).rejects.toThrow(/Invalid fraction/)
  })

  it('should throw when fraction is greater than 1', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    } as any

    await expect(
      transferFunds(mockConfig, { fraction: 1.5, recipient: 'ak_test' }),
    ).rejects.toThrow(/Invalid fraction/)
  })

  it('should throw when no connector is found', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    } as any

    await expect(
      transferFunds(mockConfig, { fraction: 0.5, recipient: 'ak_test' }),
    ).rejects.toThrow(/No connector found/)
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
