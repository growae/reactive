// The `ae_uat` half of the map-key-ordering exercise — see `MAP-ORDER.md`.
//
//   node test/integration/mapOrderDryRun.mjs [--node-url https://testnet.aeternity.io]
//
// `mapKeyOrder.integration.test.ts` posts the same calls for real, on a devnet
// this repository starts. This script runs them on a public node instead,
// through `/v3/dry-run`: real FATE, real chain state, nothing committed and
// nothing funded. The caller is generated in-process and is given a balance
// only inside the dry run, so there is no faucet step and no spend.
//
// Deployment and the calls go in one dry-run batch — the batch executes in
// sequence against the same virtual state, so the contract the first
// transaction creates is there for the ones after it.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// pnpm does not hoist, and this file sits outside every workspace package, so
// the sdk is resolved from the package that actually depends on it. The
// calldata encoder is the sdk's own dependency and is resolved through it —
// deliberately, since the point is to exercise the encoder `Contract.$call`
// uses, not whichever copy a hoist happened to leave nearby.
const here = dirname(fileURLToPath(import.meta.url))
const fromCore = createRequire(join(here, '../../packages/core/package.json'))

/**
 * `require.resolve` answers with a package's CommonJS main, and the sdk's is a
 * bundle whose named exports are not the ones its ESM entry publishes. Neither
 * package exports `./package.json`, so the package root is taken from the
 * resolved path and the manifest read off disk.
 */
async function importPackage(resolveFrom, name) {
  const main = resolveFrom.resolve(name)
  const marker = `${join('node_modules', name)}/`
  const root = main.slice(0, main.indexOf(marker) + marker.length)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const entry =
    manifest.exports?.node?.import ?? manifest.module ?? manifest.main
  return import(pathToFileURL(join(root, entry)).href)
}

const { MemoryAccount, Node, Tag, buildContractIdByContractTx, buildTxAsync } =
  await importPackage(fromCore, '@aeternity/aepp-sdk')
const { AciContractCallEncoder } = await importPackage(
  createRequire(fromCore.resolve('@aeternity/aepp-sdk')),
  '@aeternity/aepp-calldata',
)

const argv = process.argv
const NODE =
  argv.indexOf('--node-url') === -1
    ? 'https://testnet.aeternity.io'
    : argv[argv.indexOf('--node-url') + 1]
const COMPILER = 'https://v8.compiler.aepps.com'
const node = new Node(NODE)

const SOURCE = readFileSync(join(here, 'MapOrder.aes'), 'utf8')

const compiled = await (
  await fetch(`${COMPILER}/compile`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: SOURCE, options: {} }),
  })
).json()

const encoder = new AciContractCallEncoder(compiled.aci)
const account = MemoryAccount.generate()
const owner = account.address

const decodeContractBytearray = (encoded) => {
  const raw = Buffer.from(encoded.slice(encoded.indexOf('_') + 1), 'base64')
  return raw.subarray(0, raw.length - 4)
}

const cb = (hex) => {
  const bytes = Buffer.from(hex, 'hex')
  const d = (b) => createHash('sha256').update(b).digest()
  return `cb_${Buffer.concat([bytes, d(d(bytes)).subarray(0, 4)]).toString('base64')}`
}

const create = await buildTxAsync({
  tag: Tag.ContractCreateTx,
  ownerId: owner,
  nonce: 1,
  code: compiled.bytecode,
  callData: encoder.encodeCall('MapOrder', 'init', []),
  abiVersion: 3,
  vmVersion: 8,
  deposit: 0,
  amount: 0,
  gasLimit: 200000,
  gasPrice: 1000000000,
  onNode: node,
})
const contract = buildContractIdByContractTx(create)

const calls = [
  [
    'control  map(string,int) {"ab"→1,"xy"→2}',
    'bulk',
    new Map([
      ['ab', 1n],
      ['xy', 2n],
    ]),
  ],
  [
    'trigger  map(string,int) {"ä"→1,"xy"→2}',
    'bulk',
    new Map([
      ['ä', 1n],
      ['xy', 2n],
    ]),
  ],
  [
    'control  map(bits,int)   {0→1,1→2}',
    'bulk_bits',
    new Map([
      [0n, 1n],
      [1n, 2n],
    ]),
  ],
  [
    'trigger  map(bits,int)   {-1→1,-2→2}',
    'bulk_bits',
    new Map([
      [-1n, 1n],
      [-2n, 2n],
    ]),
  ],
  ['decode   emit_string_map()', 'emit_string_map', undefined],
  ['decode   emit_bits_map()', 'emit_bits_map', undefined],
]

const txs = [{ tx: create }]
const labels = ['deploy   ContractCreateTx']
let nonce = 1
for (const [label, method, arg] of calls) {
  nonce += 1
  const callData = encoder.encodeCall(
    'MapOrder',
    method,
    arg === undefined ? [] : [arg],
  )
  txs.push({
    tx: await buildTxAsync({
      tag: Tag.ContractCallTx,
      callerId: owner,
      nonce,
      contractId: contract,
      abiVersion: 3,
      amount: 0,
      gasLimit: 200000,
      gasPrice: 1000000000,
      callData,
      onNode: node,
    }),
  })
  labels.push(label)
}

// The byte-order control: the trigger's calldata with the two `(key, value)`
// pairs swapped into the node's order and nothing else changed.
nonce += 1
txs.push({
  tx: await buildTxAsync({
    tag: Tag.ContractCallTx,
    callerId: owner,
    nonce,
    contractId: contract,
    abiVersion: 3,
    amount: 0,
    gasLimit: 200000,
    gasPrice: 1000000000,
    callData: cb('2b11d72a98011b2f020978790409c3a402'),
    onNode: node,
  }),
})
labels.push('control  same bytes, node pair order')

const status = await (await fetch(`${NODE}/v3/status`)).json()
const res = await fetch(`${NODE}/v3/dry-run`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    accounts: [{ pub_key: owner, amount: '1000000000000000000000000' }],
    txs,
  }),
})
const body = await res.json()

console.log(`node     ${NODE}/v3  ${status.node_version}  ${status.network_id}`)
console.log(`height   ${status.top_block_height}`)
console.log(`caller   ${owner}  (generated in-process, never funded)`)
console.log(`contract ${contract}\n`)
for (const [i, r] of (body.results ?? []).entries()) {
  const call = r.call_obj
  const returned = call && decodeContractBytearray(call.return_value)
  // A failing call answers with an error string; a succeeding one with a FATE
  // value, which is only readable here as bytes.
  const detail = !call
    ? JSON.stringify(r.reason ?? r)
    : call.return_type === 'error'
      ? `return_type=${call.return_type} gas_used=${String(call.gas_used).padEnd(6)} reason=${JSON.stringify(returned.toString('utf8'))}`
      : `return_type=${call.return_type} gas_used=${String(call.gas_used).padEnd(6)} return_value=0x${returned.toString('hex')}`
  console.log(
    `  ${labels[i].padEnd(38)} ${String(r.result).padEnd(3)} ${detail}`,
  )
}
