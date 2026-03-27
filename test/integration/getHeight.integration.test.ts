import { beforeAll, describe, expect, it } from 'vitest'
import { getHeight } from '../../packages/core/src/actions/getHeight.js'
import { createTestConfig, waitForNode } from '../setup/integration.js'

describe.skipIf(!process.env.INTEGRATION)('getHeight (integration)', () => {
  beforeAll(async () => {
    await waitForNode()
  })

  it('should return current block height', async () => {
    const config = createTestConfig()
    const result = await getHeight(config, {})
    expect(result).toBeDefined()
    expect(typeof result.height).toBe('number')
    expect(result.height).toBeGreaterThanOrEqual(0)
  })
})
