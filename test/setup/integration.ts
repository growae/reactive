import { memory } from '../../packages/core/src/connectors/memory'
import { createConfig } from '../../packages/core/src/createConfig'
import type { Network } from '../../packages/core/src/types/network'

export const devnet: Network = {
  id: 'ae_devnet',
  name: 'Local Devnet',
  nodeUrl: 'http://localhost:3013',
  networkId: 'ae_devnet',
}

/**
 * A deliberately disposable devnet account. The secret below is committed on
 * purpose: it is generated for this suite alone, it only ever signs on the
 * throwaway `ae_devnet` chain that `docker-compose.yml` starts, and it holds
 * nothing of value on any real network. `test/config/aeternity.yaml` mines to
 * this same address, so the local node funds it from the first block and no
 * external faucet is involved. Never reuse it elsewhere and never fund it on
 * testnet or mainnet — rotate it here instead.
 */
export const FAUCET_SECRET_KEY =
  'sk_fD8RArGzn1SVugd71LYohCMdR7k6j495BwCao6BTSWEVDYyuS'
export const FAUCET_PUBLIC_KEY =
  'ak_V85oq1Pkv1QweNQ3RBkCnvBgB2v5RdCmUo3EmLxp4KFcreVDe'

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
