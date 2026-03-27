import { beforeAll, describe, expect, it } from 'vitest'
import { getBalance } from '../../packages/core/src/actions/getBalance.js'
import {
  FAUCET_PUBLIC_KEY,
  createTestConfig,
  waitForNode,
} from '../setup/integration.js'

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
