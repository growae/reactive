import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { callContract } from '../../packages/core/src/actions/callContract'
import { connect } from '../../packages/core/src/actions/connect'
import {
  DeployContractMapKeyOrderError,
  deployContract,
} from '../../packages/core/src/actions/deployContract'
import { memory } from '../../packages/core/src/connectors/memory'
import { createConfig } from '../../packages/core/src/createConfig'
import {
  COMPILER_URL,
  callInfoByHash,
  DEVNET_URL,
  devnet,
  FAUCET_SECRET_KEY,
  nextNonce,
  waitForNode,
} from '../setup/integration'

/**
 * The deployment half of the map-key-ordering defect.
 *
 * `mapKeyOrder.integration.test.ts` measures it on `callContract`. This file
 * measures it on `deployContract`, where the same `@aeternity/aepp-calldata`
 * encoder is reached through `Contract.$deploy` — which builds a
 * `ContractCreateTx` whose call data is `encode(contract, "init", args)`.
 *
 * **The node does not treat the two transactions alike, and that is the finding
 * this file exists to record.** Against the same node v7.2.0, in the same run:
 *
 *   - a `ContractCallTx` carrying a disagreeing map is *mined*, comes back
 *     `return_type=error`, and is charged the whole gas limit — the sibling
 *     file's last row measures `gas_used=200000` of a 200000 limit;
 *   - a `ContractCreateTx` carrying one in its init arguments is accepted into
 *     the mempool — the node logs `Tx pool events hashes: [th_…]` for it — and
 *     is then *never included*. Every micro block after it carries zero
 *     transactions, the node logs no error, no gas is charged, no contract is
 *     created, and the caller's nonce does not advance. The deployment fails
 *     only when the sdk gives up polling, with `Transaction not found` naming a
 *     hash the node answers `404` for. The nonce slot is reusable afterwards.
 *
 * So on this path the defect is not expensive, it is invisible, and what the
 * guard in `packages/core` buys is a named local error in place of a
 * transaction that disappears.
 *
 * Three rows: a control that deploys and runs, a triggering map the guard sees
 * and refuses, and the same map behind a `variant` — the shape the guard
 * deliberately does not descend into — which is how the node's behaviour is
 * measured through the shipping code path rather than asserted.
 *
 * `gasLimit` is given on every deployment here, as in the call exercise, so the
 * sdk never falls back to estimating gas through `/v3/dry-run`, which the
 * devnet in `docker-compose.yml` serves only on its internal interface.
 *
 * This file and the call exercise post from the same devnet account and both
 * read its next nonce as evidence that nothing was posted, so they cannot run
 * concurrently — `pnpm test:integration` passes `--no-file-parallelism` for
 * exactly this reason. Run a single file directly and the flag does not matter.
 */

const FUNDER_SECRET_KEY = process.env.AE_DEVNET_FUNDER_SK ?? FAUCET_SECRET_KEY

const GAS_LIMIT = 200_000

const SOURCE = readFileSync(
  new URL('./MapOrderInit.aes', import.meta.url),
  'utf8',
)

/** `{"ä" → 1, "xy" → 2}` — one code unit against two, two bytes against two. */
const TRIGGER = () =>
  new Map([
    ['ä', 1n],
    ['xy', 2n],
  ])

/** `{"ä" → 1, "ö" → 2}` — non-ASCII, and the two orders agree on it. */
const CONTROL = () =>
  new Map([
    ['ä', 1n],
    ['ö', 2n],
  ])

/**
 * The hash out of the sdk's poll failure.
 *
 * There is nothing else to take it from: the transaction never reaches a block,
 * so `deployContract` has no return value, and the sdk raises a transport error
 * rather than anything carrying the hash as a field. Reading it out of the
 * message is exactly as fragile as it looks — which is the point, and is why
 * the row below asserts on the node's answer rather than on this error.
 */
function hashInMessage(error: unknown): string | undefined {
  return /th_[1-9A-HJ-NP-Za-km-z]+/.exec(String((error as Error)?.message))?.[0]
}

describe.skipIf(!process.env.INTEGRATION)(
  'map key ordering on deployment (integration)',
  () => {
    let config: ReturnType<typeof createConfig>
    let owner: string
    let aci: unknown[]
    let bytecode: string

    beforeAll(async () => {
      await waitForNode()

      config = createConfig({
        networks: [{ ...devnet, nodeUrl: DEVNET_URL }],
        connectors: [memory({ accounts: [{ secretKey: FUNDER_SECRET_KEY }] })],
      })
      const connection = await connect(config, {
        connector: config.connectors[0]!,
      })
      owner = connection.accounts[0]!

      const compiled = await fetch(`${COMPILER_URL}/compile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: SOURCE, options: {} }),
      })
      if (!compiled.ok)
        throw new Error(`compiler ${compiled.status}: ${await compiled.text()}`)
      const result = (await compiled.json()) as {
        bytecode: string
        aci: unknown[]
      }
      aci = result.aci
      bytecode = result.bytecode

      console.log(`\nnode     ${DEVNET_URL}\nowner    ${owner}\n`)
    }, 180_000)

    async function deploy(initArgs: unknown[]) {
      return deployContract(config, {
        bytecode,
        aci,
        initArgs,
        options: { gasLimit: GAS_LIMIT },
      })
    }

    it('deploys with init arguments the encoder gets right', async () => {
      const deployed = await deploy([CONTROL(), { Wrapped: [CONTROL()] }])

      expect(deployed.address).toMatch(/^ct_/)
      const info = await callInfoByHash(deployed.txHash)
      console.log(
        `  ACCEPTED  control init             return_type=${info?.returnType} gas_used=${info?.gasUsed}`,
      )
      expect(info?.returnType).toBe('ok')

      // The contract is not merely created, it ran: `init` summed both maps and
      // put the total in the state. Called on chain rather than statically,
      // because this devnet does not serve `/v3/dry-run` externally.
      const size = await callContract(config, {
        address: deployed.address,
        aci,
        method: 'size',
        options: { gasLimit: GAS_LIMIT },
      })
      expect(size.decodedResult).toBe(4n)
    }, 180_000)

    it('refuses a triggering init map locally, at no gas', async () => {
      const before = await nextNonce(owner)

      const error = await deploy([TRIGGER(), { Wrapped: [CONTROL()] }]).catch(
        (e) => e,
      )

      expect(error).toBeInstanceOf(DeployContractMapKeyOrderError)
      expect(error.defects).toEqual([
        {
          path: 'entries',
          keyType: 'string',
          nodeOrder: ['xy', 'ä'],
          encoderOrder: ['ä', 'xy'],
        },
      ])
      // Nothing was built and nothing was posted, which is the whole of what
      // the guard buys over the row below.
      expect(await nextNonce(owner)).toBe(before)
      console.log(
        '  REFUSED   trigger init             nothing posted=true gas_used=0',
      )
    }, 180_000)

    it('a deployment the guard cannot see is accepted and then never included', async () => {
      // The same triggering map, behind the `variant` the guard stops
      // descending into. This is what every map-in-init deployment did before
      // the guard, and what the shapes the guard misses still do.
      const before = await nextNonce(owner)

      const error = await deploy([CONTROL(), { Wrapped: [TRIGGER()] }]).catch(
        (e) => e,
      )

      // Not the guard — this row exists to measure the miss.
      expect(error).not.toBeInstanceOf(DeployContractMapKeyOrderError)

      const hash = hashInMessage(error)
      const onChain = hash
        ? await fetch(`${DEVNET_URL}/v3/transactions/${hash}`)
        : undefined
      console.log(
        `  LOST      trigger init in variant  error=${(error as Error)?.name} tx=${hash} node_says=${onChain?.status}`,
      )

      // The node took the transaction and then dropped it. Nothing is on chain
      // under that hash, nothing was charged, and the nonce never moved — so
      // unlike the call path there is no gas bill, and unlike the row above
      // there is no name for what went wrong.
      expect(hash).toBeDefined()
      expect(onChain?.status).toBe(404)
      expect(await nextNonce(owner)).toBe(before)

      // And the slot is reusable: the very next deployment takes the nonce the
      // lost one was signed with. That is what makes this cheap and invisible
      // rather than expensive and loud.
      const recovered = await deploy([CONTROL(), { Wrapped: [CONTROL()] }])
      expect(recovered.address).toMatch(/^ct_/)
      expect(await nextNonce(owner)).toBe(before + 1)
    }, 180_000)
  },
)
