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

/**
 * The Sophia compiler the integration exercises compile against. A local
 * `aesophia_http` is faster and works offline; the public one is the default so
 * that `docker compose up` plus `pnpm test:integration` is all a re-run needs.
 */
export const COMPILER_URL =
  process.env.AE_COMPILER_URL ?? 'https://v8.compiler.aepps.com'

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** How long a posted transaction is given to be included before a read gives up. */
export const INCLUSION_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 100

export type CallInfo = {
  returnType?: string
  returnValue?: string
  gasUsed?: number
}

/**
 * The call object of **one named transaction**, polled until the node has
 * included it.
 *
 * The sdk reports a failed contract call as `Invocation failed: ""` and the
 * node's call object is where the answer actually is, so this read is what
 * turns "something went wrong" into a return type and a gas figure.
 *
 * `/info` answers `404` while the transaction is still in the mempool, so an
 * unsuccessful read here is "not yet", never "no such call". Reading by hash
 * rather than by taking the most recent transaction off the top of the chain is
 * deliberate: the latter is a *different* transaction for as long as the node
 * has not included the one just posted.
 */
export async function callInfoByHash(
  hash: string,
  url = DEVNET_URL,
): Promise<CallInfo | undefined> {
  const deadline = Date.now() + INCLUSION_TIMEOUT_MS
  do {
    const response = await fetch(`${url}/v3/transactions/${hash}/info`)
    if (response.ok) {
      const info = await response.json()
      if (info?.call_info)
        return {
          returnType: info.call_info.return_type,
          returnValue: info.call_info.return_value,
          gasUsed: info.call_info.gas_used,
        }
    }
    await sleep(POLL_INTERVAL_MS)
  } while (Date.now() < deadline)
  return undefined
}

/** The nonce the next transaction this account posts will carry. */
export async function nextNonce(
  account: string,
  url = DEVNET_URL,
): Promise<number> {
  const { next_nonce } = await (
    await fetch(`${url}/v3/accounts/${account}/next-nonce`)
  ).json()
  return next_nonce
}
