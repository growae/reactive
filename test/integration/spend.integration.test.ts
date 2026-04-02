import { beforeAll, describe, expect, it } from 'vitest'
import { connect } from '../../packages/core/src/actions/connect'
import { spend } from '../../packages/core/src/actions/spend'
import { createTestConfig, waitForNode } from '../setup/integration'

// Second well-known devmode account — receives the spend tx
const RECIPIENT = 'ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP'

describe.skipIf(!process.env.INTEGRATION)('spend (integration)', () => {
  beforeAll(async () => {
    await waitForNode()
  })

  it('should send AE between accounts', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    const result = await spend(config, {
      recipient: RECIPIENT,
      amount: '1000000000000000000',
    })

    expect(result).toBeDefined()
    expect(result.hash).toBeDefined()
    expect(typeof result.hash).toBe('string')
  })
})
