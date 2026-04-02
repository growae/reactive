import { memory } from '../../packages/core/src/connectors/memory'
import { createConfig } from '../../packages/core/src/createConfig'
import type { Network } from '../../packages/core/src/types/network'

export const devnet: Network = {
  id: 'ae_devnet',
  name: 'Local Devnet',
  nodeUrl: 'http://localhost:3013',
}

// Well-known genesis-funded devmode account (sk_base58 format, 100M AE pre-funded).
// Source: aeproject default accounts / aeternity-playground devmode accounts.
export const FAUCET_SECRET_KEY =
  'sk_woRkv1SfE49sCNbmkHGLUdzPsH82kVGhTPTWebH8Ysk2MqQSh'
export const FAUCET_PUBLIC_KEY =
  'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk'

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
