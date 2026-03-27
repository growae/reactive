import { describe, it, expect, beforeAll } from 'vitest'
import { getBalance } from '../../packages/core/src/actions/getBalance.js'
import { createTestConfig, waitForNode, FAUCET_PUBLIC_KEY } from '../setup/integration.js'

describe.skipIf(!process.env.INTEGRATION)('getBalance (integration)', () => {
  beforeAll(async () => {
    await waitForNode()
  })

  it('should return the faucet balance', async () => {
    const config = createTestConfig()
    const result = await getBalance(config, {
      address: FAUCET_PUBLIC_KEY,
    })
    expect(result).toBeDefined()
    expect(typeof result.balance).toBe('string')
    expect(BigInt(result.balance)).toBeGreaterThan(0n)
  })
})
