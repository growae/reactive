import { beforeAll, describe, expect, it } from 'vitest'
import { getHeight } from '../../packages/core/src/actions/getHeight'
import { createTestConfig, waitForNode } from '../setup/integration'

describe.skipIf(!process.env.INTEGRATION)('getHeight (integration)', () => {
  beforeAll(async () => {
    await waitForNode()
  })

  it('should return current block height', async () => {
    const config = createTestConfig()
    const height = await getHeight(config, {})
    expect(height).toBeDefined()
    expect(typeof height).toBe('number')
    expect(height).toBeGreaterThanOrEqual(0)
  })
})
