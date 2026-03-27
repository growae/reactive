import { memory } from '../../packages/core/src/connectors/memory.js'
import { createConfig } from '../../packages/core/src/createConfig.js'
import type { Network } from '../../packages/core/src/types/network.js'

export const devnet: Network = {
  id: 'ae_devnet',
  name: 'Local Devnet',
  nodeUrl: 'http://localhost:3013',
  networkId: 'ae_devnet',
}

export const FAUCET_SECRET_KEY =
  'e6a91d633c77cf5771329d3571e1b97e4b6a8da1f92dec562e713ca30fba722c0fc9aa4e782fbd71af7de0a7b40ced95e03b73cb57d0fcf06a54c75ce36f01f02'
export const FAUCET_PUBLIC_KEY =
  'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'

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
