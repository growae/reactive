import { beforeAll, describe, expect, it } from 'vitest'
import { connect } from '../../packages/core/src/actions/connect'
import { getBalance } from '../../packages/core/src/actions/getBalance'
import { spend } from '../../packages/core/src/actions/spend'
import {
  RECIPIENT_PUBLIC_KEY,
  createTestConfig,
  waitForNode,
} from '../setup/integration'

const AMOUNT = '1000000000000000000'

describe.skipIf(!process.env.INTEGRATION)('spend (integration)', () => {
  beforeAll(async () => {
    await waitForNode()
  })

  it('should send AE between accounts', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    const before = BigInt(
      await getBalance(config, { address: RECIPIENT_PUBLIC_KEY }),
    )

    // The node rejects a badly signed transaction on push, so a successful
    // post already proves the faucet key signs for ae_devnet.
    const result = await spend(config, {
      recipient: RECIPIENT_PUBLIC_KEY,
      amount: AMOUNT,
    })

    expect(result).toBeDefined()
    expect(result.hash).toBeDefined()
    expect(typeof result.hash).toBe('string')

    // Dev mode emits a micro block as soon as the transaction hits the
    // mempool, but the poll keeps the assertion off that timing.
    let after = before
    for (let i = 0; i < 30 && after === before; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      after = BigInt(
        await getBalance(config, { address: RECIPIENT_PUBLIC_KEY }),
      )
    }

    expect(after - before).toBe(BigInt(AMOUNT))
  }, 60_000)
})
