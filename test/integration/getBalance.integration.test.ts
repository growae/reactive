import { beforeAll, describe, expect, it } from 'vitest'
import { getBalance } from '../../packages/core/src/actions/getBalance'
import {
  FAUCET_PUBLIC_KEY,
  createTestConfig,
  waitForNode,
} from '../setup/integration'

describe.skipIf(!process.env.INTEGRATION)('getBalance (integration)', () => {
  beforeAll(async () => {
    await waitForNode()
  })

  it('should return the faucet balance', async () => {
    const config = createTestConfig()
    const balance = await getBalance(config, {
      address: FAUCET_PUBLIC_KEY,
    })
    expect(balance).toBeDefined()
    expect(typeof balance).toBe('string')
    expect(BigInt(balance)).toBeGreaterThan(0n)
  })
})
