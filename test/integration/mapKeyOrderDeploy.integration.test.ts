import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { callContract } from '../../packages/core/src/actions/callContract'
import { connect } from '../../packages/core/src/actions/connect'
import {
  DeployContractInvocationError,
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
 * `ContractCreateTx` whose call data is `encode(contract, "init", args)` — and
 * where an argument the two implementations order differently is not merely
 * refused but refused *after* being mined and charged.
 *
 * Three rows, and the third is the one that matters:
 *
 *   1. a control map in `init`, which deploys and runs;
 *   2. a triggering map in `init`, which `deployContract` now refuses locally,
 *      at no gas and with the caller's next nonce unmoved;
 *   3. the same triggering map behind a `variant`, which the guard deliberately
 *      does not descend into. That deployment goes to the chain exactly as it
 *      did before the guard existed, and the assertions on it are the
 *      measurement this exercise exists for: mined, `return_type=error`, and
 *      **the whole gas limit charged for a contract that was never created**.
 *
 * Row 3 is also what the invocation wrap buys. The sdk throws
 * `Invocation failed: ""` with no transaction attached on the on-chain path, so
 * without the wrap there is no hash to read that call object back by — the test
 * below could not make its own measurement.
 *
 * `gasLimit` is given on every deployment here, as in the call exercise, so the
 * sdk never falls back to estimating gas through `/v3/dry-run`, which the
 * devnet in `docker-compose.yml` serves only on its internal interface. That is
 * also the shape in which the defect costs money: `Contract.$deploy` builds its
 * `gasLimit` as `opt.gasLimit ?? await this._estimateGas('init', …)`, so a
 * caller who leaves it out has the estimate's dry run refuse the deployment
 * first, for nothing. Read off the sdk, not measured here — this devnet cannot
 * serve that dry run.
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

    it('deploys with init arguments the encoder gets right', async () => {
      const deployed = await deployContract(config, {
        bytecode,
        aci,
        initArgs: [CONTROL(), { Wrapped: [CONTROL()] }],
        options: { gasLimit: GAS_LIMIT },
      })

      expect(deployed.address).toMatch(/^ct_/)
      const info = await callInfoByHash(deployed.txHash)
      console.log(
        `  ACCEPTED  control init             return_type=${info?.returnType} gas_used=${info?.gasUsed}`,
      )
      expect(info?.returnType).toBe('ok')

      // The contract is not merely created, it ran: `init` summed both maps.
      const size = await callContract(config, {
        address: deployed.address,
        aci,
        method: 'size',
        options: { callStatic: true },
      })
      expect(size.decodedResult).toBe(4n)
    }, 180_000)

    it('refuses a triggering init map locally, at no gas', async () => {
      const before = await nextNonce(owner)

      const error = await deployContract(config, {
        bytecode,
        aci,
        initArgs: [TRIGGER(), { Wrapped: [CONTROL()] }],
        options: { gasLimit: GAS_LIMIT },
      }).catch((e) => e)

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

    it('charges the whole gas limit for a deployment the guard cannot see', async () => {
      // The same triggering map, behind the `variant` the guard stops
      // descending into. This is what every map-in-init deployment did before
      // the guard, and what the shapes the guard misses still do.
      const before = await nextNonce(owner)

      const error = await deployContract(config, {
        bytecode,
        aci,
        initArgs: [CONTROL(), { Wrapped: [TRIGGER()] }],
        options: { gasLimit: GAS_LIMIT },
      }).catch((e) => e)

      expect(error).toBeInstanceOf(DeployContractInvocationError)
      // The sdk reports this as `Invocation failed: ""` with no transaction —
      // the hash below exists only because the wrap observed the signing.
      expect(error.transactionHash).toMatch(/^th_/)

      const info = await callInfoByHash(error.transactionHash)
      console.log(
        `  REJECTED  trigger init in variant  return_type=${info?.returnType} gas_used=${info?.gasUsed} of ${GAS_LIMIT}`,
      )

      // Mined — the nonce moved — refused inside the decoder, and charged the
      // whole gas limit for a contract that does not exist.
      expect(await nextNonce(owner)).toBe(before + 1)
      expect(info?.returnType).toBe('error')
      expect(info?.gasUsed).toBe(GAS_LIMIT)
    }, 180_000)
  },
)
