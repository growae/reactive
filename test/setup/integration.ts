import { memory } from '../../packages/core/src/connectors/memory'
import { createConfig } from '../../packages/core/src/createConfig'
import type { Network } from '../../packages/core/src/types/network'

export const devnet: Network = {
  id: 'ae_devnet',
  name: 'Local Devnet',
  nodeUrl: 'http://localhost:3013',
}

// Genesis-funded account — pre-funded in test/config/aeternity.yaml genesis_accounts.
// Same account used by aepp-sdk-js integration tests.
export const FAUCET_SECRET_KEY =
  'sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf'
export const FAUCET_PUBLIC_KEY =
  'ak_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf'

export function createTestConfig() {
  return createConfig({
    networks: [devnet],
    connectors: [
      memory({
        accounts: [{ secretKey: FAUCET_SECRET_KEY }],
      }),
    ],
  })
}

export async function waitForNode(
  url = 'http://localhost:3013',
  maxRetries = 30,
  intervalMs = 2000,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${url}/v3/status`)
      if (res.ok) return
    } catch {
      // node not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(
    `Node at ${url} did not become ready within ${maxRetries * intervalMs}ms`,
  )
}
