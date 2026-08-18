import { memory } from '../../packages/core/src/connectors/memory'
import { createConfig } from '../../packages/core/src/createConfig'
import type { Network } from '../../packages/core/src/types/network'

export const NODE_URL = process.env.AE_NODE_URL ?? 'http://localhost:3013'

export const devnet: Network = {
  id: 'ae_devnet',
  name: 'Local Devnet',
  nodeUrl: NODE_URL,
  networkId: 'ae_devnet',
}

/**
 * Throwaway devnet keypair. It only ever holds tokens on the local devnet
 * defined by test/config/aeternity.yaml, which pre-funds FAUCET_PUBLIC_KEY
 * from its genesis accounts — the two must be changed together.
 *
 * aepp-sdk v14 takes the `sk_`-prefixed encoding, not a raw hex seed.
 */
export const FAUCET_SECRET_KEY =
  'sk_23dvMkkLdzvYZeWUtKvemFwkM6sB4pRjaskMnb7rFuGk8ajmqP'
export const FAUCET_PUBLIC_KEY =
  'ak_2JEnCrFapeDENGrJBasAauMH11Wk5agJCC2jTKRhV8SXjsfjJx'

/** Unfunded devnet address used as a spend target. */
export const RECIPIENT_PUBLIC_KEY =
  'ak_2faBrmBB7wDZs9FJjJNjucnxVhdnYtXFfv5Exs31iJL4QZWaaa'

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
  url = NODE_URL,
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
