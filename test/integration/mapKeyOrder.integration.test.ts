import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildTransaction } from '../../packages/core/src/actions/buildTransaction'
import { callContract } from '../../packages/core/src/actions/callContract'
import { connect } from '../../packages/core/src/actions/connect'
import { deployContract } from '../../packages/core/src/actions/deployContract'
import { sendTransaction } from '../../packages/core/src/actions/sendTransaction'
import { signTransaction } from '../../packages/core/src/actions/signTransaction'
import { memory } from '../../packages/core/src/connectors/memory'
import { createConfig } from '../../packages/core/src/createConfig'
import {
  DEVNET_URL,
  FAUCET_SECRET_KEY,
  devnet,
  waitForNode,
} from '../setup/integration'

/**
 * The on-node half of the map-key-ordering defect.
 *
 * `@aeternity/aepp-calldata` sorts a `map` argument's keys before serialising
 * it, and its order is not the node's. Two argument shapes make the two orders
 * disagree, and both are reachable from ordinary caller code:
 *
 *   1. `map(string, _)` where two keys order differently by UTF-16 code units
 *      than by UTF-8 bytes. Needs a non-ASCII key — for all-ASCII keys the two
 *      lengths coincide and the orders cannot differ.
 *   2. `map(bits, _)` holding two negative keys.
 *
 * `aeb_fate_encoding:deserialize2/1` re-sorts the pairs it reads and raises
 * `unknown_map_serialization_format` when the incoming order is not its own, so
 * the disagreement is not cosmetic: the call cannot execute.
 *
 * This exercise is shaped like `crates/ae-parity/node-exercise.mjs`: an
 * acceptance result only means something next to controls, so every trigger is
 * posted beside an argument of the same type that cannot trigger it, and the
 * last test posts the same two entries in the node's byte order to pin the
 * cause on the ordering rather than on the non-ASCII content.
 *
 * The path under test is the shipping one: `callContract` → `Contract.$call` →
 * `AciContractCallEncoder`, i.e. `packages/core/src/actions/callContract.ts:63`.
 */

const COMPILER_URL =
  process.env.AE_COMPILER_URL ?? 'https://v8.compiler.aepps.com'

/**
 * The devnet account this exercise funds its own transactions from. Defaults to
 * the suite's committed genesis account so `docker compose up` is all a re-run
 * needs; the recorded run overrode it with a key generated for that run and a
 * matching genesis file, because the row it was measured for asked for
 * throwaway key material.
 */
const FUNDER_SECRET_KEY = process.env.AE_DEVNET_FUNDER_SK ?? FAUCET_SECRET_KEY

const GAS_LIMIT = 200_000

/** Shared with `mapOrderDryRun.mjs`, which posts the same calls on a public node. */
const SOURCE = readFileSync(new URL('./MapOrder.aes', import.meta.url), 'utf8')

type CallInfo = { returnType?: string; returnValue?: string; gasUsed?: number }
type Outcome = {
  ok: boolean
  decoded?: unknown
  error?: string
  info?: CallInfo | undefined
}

/**
 * The sdk reports a failed contract call as `Invocation failed: ""` and drops
 * the transaction hash on the way out, so its own error says nothing about why
 * the call failed. The node's call object carries the answer; it is read back
 * off the chain here, because without it this exercise would only establish
 * that *something* went wrong.
 *
 * Every read below is of **one named transaction** and waits for that
 * transaction to be included. The first version of this helper took instead the
 * most recent `ContractCallTx` by this caller off the top of the chain, which
 * is a *different* transaction for as long as the node has not included the one
 * just posted: it answered with the previous call's result, in tens of
 * milliseconds against the seconds a real read takes, and failed the suite
 * about one run in five.
 */

const INCLUSION_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 100
/** A transaction posted moments ago sits at the top of the chain, not deep in it. */
const GENERATIONS_SEARCHED = 20

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The call object of one transaction, polled until the node has included it.
 * `/info` answers `404` while the transaction is still in the mempool, so an
 * unsuccessful read here is "not yet", never "no such call".
 */
async function callInfoByHash(hash: string): Promise<CallInfo | undefined> {
  const deadline = Date.now() + INCLUSION_TIMEOUT_MS
  do {
    const response = await fetch(`${DEVNET_URL}/v3/transactions/${hash}/info`)
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
async function nextNonce(account: string): Promise<number> {
  const { next_nonce } = await (
    await fetch(`${DEVNET_URL}/v3/accounts/${account}/next-nonce`)
  ).json()
  return next_nonce
}

/**
 * The hash of the contract call this caller posted with `nonce`.
 *
 * Needed only on the failure path, where the sdk throws without the hash.
 * `(caller, nonce)` names exactly one transaction that can ever reach this
 * chain, so this is the same "that transaction, not the latest one" read as
 * `callInfoByHash` — it just has to find the hash first.
 */
async function callHashByNonce(
  caller: string,
  nonce: number,
): Promise<string | undefined> {
  const deadline = Date.now() + INCLUSION_TIMEOUT_MS
  do {
    const status = await (await fetch(`${DEVNET_URL}/v3/status`)).json()
    const floor = Math.max(1, status.top_block_height - GENERATIONS_SEARCHED)
    for (let height = status.top_block_height; height >= floor; height--) {
      const generation = await (
        await fetch(`${DEVNET_URL}/v3/generations/height/${height}`)
      ).json()
      for (const micro of [...(generation.micro_blocks ?? [])].reverse()) {
        const { transactions } = await (
          await fetch(
            `${DEVNET_URL}/v3/micro-blocks/hash/${micro}/transactions`,
          )
        ).json()
        const call = [...transactions]
          .reverse()
          .find(
            (t: any) =>
              t.tx?.type === 'ContractCallTx' &&
              t.tx?.caller_id === caller &&
              t.tx?.nonce === nonce,
          )
        if (call) return call.hash
      }
    }
    await sleep(POLL_INTERVAL_MS)
  } while (Date.now() < deadline)
  return undefined
}

/** `JSON.stringify` renders a `Map` as `{}` and throws on a `bigint`. */
function render(value: unknown): string {
  if (value instanceof Map)
    return `Map(${[...value.entries()]
      .map(([k, v]) => `${render(k)} → ${render(v)}`)
      .join(', ')})`
  if (typeof value === 'bigint') return `${value}n`
  return JSON.stringify(value) ?? String(value)
}

function report(label: string, outcome: Outcome) {
  const info = outcome.info
  const tail = info
    ? `return_type=${info.returnType} return_value=${info.returnValue} gas_used=${info.gasUsed}`
    : 'no call object on chain'
  console.log(
    `  ${(outcome.ok ? 'ACCEPTED' : 'REJECTED').padEnd(8)}  ${label.padEnd(30)}  ${
      outcome.ok ? `→ ${render(outcome.decoded)}  ` : ''
    }${tail}`,
  )
}

describe.skipIf(!process.env.INTEGRATION)(
  'map key ordering (integration)',
  () => {
    let config: ReturnType<typeof createConfig>
    let address: string
    let caller: string
    let aci: unknown[]

    beforeAll(async () => {
      await waitForNode()

      config = createConfig({
        networks: [{ ...devnet, nodeUrl: DEVNET_URL }],
        connectors: [memory({ accounts: [{ secretKey: FUNDER_SECRET_KEY }] })],
      })
      const connection = await connect(config, {
        connector: config.connectors[0]!,
      })
      caller = connection.accounts[0]!

      // Compiled over HTTP rather than through `CompilerHttp`, so this file
      // needs no direct dependency on the sdk — the encoder under test is
      // reached through `callContract` either way, and the compiler is not part
      // of it.
      const compiled = await fetch(`${COMPILER_URL}/compile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: SOURCE, options: {} }),
      })
      if (!compiled.ok)
        throw new Error(`compiler ${compiled.status}: ${await compiled.text()}`)
      const { bytecode, aci: compiledAci } = (await compiled.json()) as {
        bytecode: string
        aci: unknown[]
      }
      aci = compiledAci

      // `gasLimit` is given on every call in this file so the sdk never falls
      // back to estimating gas through `/v3/dry-run`, which the devnet in
      // `docker-compose.yml` serves only on its internal interface.
      const deployed = await deployContract(config, {
        bytecode,
        aci,
        options: { gasLimit: GAS_LIMIT },
      })
      address = deployed.address

      console.log(
        `\nnode     ${DEVNET_URL}\ncontract ${address}\ncaller   ${caller}\n`,
      )
    }, 180_000)

    async function call(method: string, args: unknown[]): Promise<Outcome> {
      // Read before posting: on the failure path this is the only handle left
      // on the transaction the call is about to make.
      const nonce = await nextNonce(caller)
      try {
        const result = await callContract(config, {
          address,
          aci,
          method,
          args,
          options: { gasLimit: GAS_LIMIT },
        })
        return {
          ok: true,
          decoded: result.decodedResult,
          info: await callInfoByHash(result.hash),
        }
      } catch (error: any) {
        const hash = await callHashByNonce(caller, nonce)
        return {
          ok: false,
          error: String(error?.message ?? error),
          info: hash ? await callInfoByHash(hash) : undefined,
        }
      }
    }

    it('string keys: an all-ASCII map is accepted, a non-ASCII one is not', async () => {
      console.log('map(string, int):')
      const control = await call('bulk', [
        new Map([
          ['ab', 1n],
          ['xy', 2n],
        ]),
      ])
      report('control  {"ab"→1, "xy"→2}', control)

      const trigger = await call('bulk', [
        new Map([
          ['ä', 1n],
          ['xy', 2n],
        ]),
      ])
      report('trigger  {"ä"→1, "xy"→2}', trigger)

      // Insertion order is irrelevant — the encoder sorts, so the caller has no
      // lever here. Both orderings must produce the same rejection.
      const reversed = await call('bulk', [
        new Map([
          ['xy', 2n],
          ['ä', 1n],
        ]),
      ])
      report('trigger  {"xy"→2, "ä"→1}', reversed)

      expect(control.ok).toBe(true)
      expect(control.info?.returnType).toBe('ok')
      expect(trigger.ok).toBe(false)
      expect(trigger.info?.returnType).toBe('error')
      expect(reversed.ok).toBe(false)
      expect(reversed.info?.returnType).toBe('error')
    }, 180_000)

    it('bits keys: two non-negative keys are accepted, two negative ones are not', async () => {
      console.log('map(bits, int):')
      const control = await call('bulk_bits', [
        new Map([
          [0n, 1n],
          [1n, 2n],
        ]),
      ])
      report('control  {0→1, 1→2}', control)

      const trigger = await call('bulk_bits', [
        new Map([
          [-1n, 1n],
          [-2n, 2n],
        ]),
      ])
      report('trigger  {-1→1, -2→2}', trigger)

      expect(control.ok).toBe(true)
      expect(control.info?.returnType).toBe('ok')
      expect(trigger.ok).toBe(false)
      expect(trigger.info?.returnType).toBe('error')
    }, 180_000)

    it('the decode side returns the node order, and feeding it back fails', async () => {
      console.log('decode side — the node builds the map, we read it:')
      const strings = await call('emit_string_map', [])
      report('emit_string_map()', strings)

      const bits = await call('emit_bits_map', [])
      report('emit_bits_map()', bits)

      expect(strings.ok).toBe(true)
      expect(bits.ok).toBe(true)

      // The node cannot emit an unsorted map, so decoding is safe — and what it
      // emits is the node's own order, which is the opposite of the encoder's
      // in both trigger shapes. That makes these two lines the measurement of
      // the correct order, not just a decode check.
      expect([...(strings.decoded as Map<string, bigint>).keys()]).toEqual([
        'xy',
        'ä',
      ])
      expect([...(bits.decoded as Map<bigint, bigint>).keys()]).toEqual([
        -2n,
        -1n,
      ])

      // The round trip is the shape an application actually writes: read a map
      // off the chain, hand it back to a call. Re-encoding runs through the
      // same encoder, so the value having come from the chain buys nothing.
      console.log('round trip — the decoded map handed straight back:')
      const roundTrip = await call('bulk', [strings.decoded])
      report('bulk(emit_string_map())', roundTrip)
      expect(roundTrip.ok).toBe(false)
      expect(roundTrip.info?.returnType).toBe('error')
    }, 180_000)

    it('the same two entries in the node byte order are accepted', async () => {
      // Everything above shows a rejection. Alone that is not enough to blame
      // the ordering: a non-ASCII key could in principle be refused for its
      // content. So the same call is posted twice at the byte level, differing
      // only in which of the two `(key, value)` pairs comes first.
      //
      //   2b11d72a9801 1b  the `bulk` call frame
      //   2f02             a map of two entries
      //   09c3a4 02        "ä" → 1
      //   097879 04        "xy" → 2
      //
      // The encoder emits `"ä"` first, having compared `"ä".length === 1`
      // against `"xy".length === 2`. `aeb_fate_data:lt/2` compares
      // `byte_size/1` — both keys are two bytes — and then the bytes
      // themselves, where `0x78 < 0xc3`, so the node's order is `"xy"` first.
      const encoderOrder = '2b11d72a98011b2f0209c3a40209787904'
      const nodeOrder = '2b11d72a98011b2f020978790409c3a402'

      console.log('the same call, byte-identical but for the pair order:')
      for (const [label, hex] of [
        ['encoder order  "ä" first', encoderOrder],
        ['node order     "xy" first', nodeOrder],
      ] as const) {
        const tx = await buildTransaction(config, {
          tag: 43, // Tag.ContractCallTx
          callerId: caller,
          nonce: await nextNonce(caller),
          contractId: address,
          abiVersion: 3,
          amount: 0,
          gasLimit: GAS_LIMIT,
          gasPrice: 1_000_000_000,
          callData: encodeContractBytearray(hex),
        })
        const signed = await signTransaction(config, { tx })
        // `sendTransaction` returns as soon as the node has accepted the
        // transaction into its mempool, so the call object does not exist yet.
        // Both halves of this loop post from the same account, and reading
        // anything other than this hash reads the previous iteration's result.
        const { hash } = await sendTransaction(config, { tx: signed })
        const info = await callInfoByHash(hash)
        console.log(
          `  ${label.padEnd(30)}  return_type=${info?.returnType} gas_used=${info?.gasUsed}`,
        )
        if (label.startsWith('encoder')) expect(info?.returnType).toBe('error')
        else expect(info?.returnType).toBe('ok')
      }
    }, 180_000)
  },
)

/** base64check with a `cb_` prefix — the envelope contract bytearrays use. */
function encodeContractBytearray(hex: string): string {
  const bytes = Buffer.from(hex, 'hex')
  const digest = (b: Buffer) => createHash('sha256').update(b).digest()
  const check = digest(digest(bytes)).subarray(0, 4)
  return `cb_${Buffer.concat([bytes, check]).toString('base64')}`
}
