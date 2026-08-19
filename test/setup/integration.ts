import { memory } from '../../packages/core/src/connectors/memory'
import { createConfig } from '../../packages/core/src/createConfig'
import type { Network } from '../../packages/core/src/types/network'

export const DEVNET_NETWORK_ID = 'ae_devnet'

/**
 * 3013 is the æternity default, so on a host already running a node it belongs
 * to that node, not to ours. Point this at the devnet `docker-compose.yml`
 * publishes — see `AE_DEVNET_PORT` there for moving the published port.
 */
export const DEVNET_URL = process.env.AE_DEVNET_URL ?? 'http://localhost:3013'

export const devnet: Network = {
  id: DEVNET_NETWORK_ID,
  name: 'Local Devnet',
  nodeUrl: DEVNET_URL,
  networkId: DEVNET_NETWORK_ID,
}

/**
 * A deliberately disposable devnet account. The secret below is committed on
 * purpose: it is generated for this suite alone, it only ever signs on the
 * throwaway `ae_devnet` chain that `docker-compose.yml` starts, and it holds
 * nothing of value on any real network. `test/config/accounts.json` pre-funds
 * it in that chain's genesis block, so the balance is there the moment the node
 * answers and no faucet, mining or funding step is involved. Never reuse it
 * elsewhere and never fund it on testnet or mainnet — rotate it here instead.
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

/** A node answered, but it is not the throwaway chain this suite may write to. */
export class WrongChainError extends Error {
  override readonly name = 'WrongChainError'
}

/**
 * Waits for the devnet, and refuses to proceed if something else answers.
 *
 * A readiness check that only asserts `200` is not enough here: any æternity
 * node answers `/v3/status` happily, so a mainnet or testnet node on the same
 * default port would take every request this suite makes and the gate would
 * report green against the wrong chain.
 */
export async function waitForNode(
  url = DEVNET_URL,
  maxRetries = 30,
  intervalMs = 2000,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    let networkId: string | undefined
    try {
      const res = await fetch(`${url}/v3/status`)
      if (res.ok)
        networkId = ((await res.json()) as { network_id?: string }).network_id
    } catch {
      // node not ready yet
    }

    // Deliberately outside the catch: the wrong chain is a hard stop, not a
    // not-ready-yet, and the catch above would swallow it into a timeout that
    // blames the node for being slow.
    if (networkId !== undefined) {
      if (networkId !== DEVNET_NETWORK_ID)
        throw new WrongChainError(
          `${url} is ${networkId}, not ${DEVNET_NETWORK_ID} — refusing to run the integration suite against it. Start the devnet from docker-compose.yml, or set AE_DEVNET_URL if it is published on another port.`,
        )
      return
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(
    `Node at ${url} did not become ready within ${maxRetries * intervalMs}ms`,
  )
}
