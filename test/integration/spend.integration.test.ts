import { beforeAll, describe, expect, it } from 'vitest'
import { connect } from '../../packages/core/src/actions/connect.js'
import { spend } from '../../packages/core/src/actions/spend.js'
import { createTestConfig, waitForNode } from '../setup/integration.js'

describe.skipIf(!process.env.INTEGRATION)('spend (integration)', () => {
  beforeAll(async () => {
    await waitForNode()
  })

  it('should send AE between accounts', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    const result = await spend(config, {
      recipientId: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU',
      amount: '1000000000000000000',
    })

    expect(result).toBeDefined()
    expect(result.hash).toBeDefined()
    expect(typeof result.hash).toBe('string')
  })
})
