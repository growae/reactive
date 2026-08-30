// Generates the transaction vector corpus in `vectors/` from the reference
// JavaScript SDK. Do not run it directly — use the harness:
//
//   node ../../ae-parity/regenerate.mjs           # check it still reproduces
//   node ../../ae-parity/regenerate.mjs --write   # take new bytes, review the diff
//
// Node resolves a bare specifier from the importing *module's* directory rather
// than the working directory, so this file cannot see `@aeternity/aepp-sdk`
// wherever it is installed and running it in place always fails. The harness
// installs the version the corpus records for itself, copies this file next to
// that install, runs it, and diffs — which is also what keeps the committed
// bytes honest.
//
// The corpus is committed so the Rust tests are offline and bisectable, and so
// that regenerating it on an SDK bump produces a reviewable diff. Every address
// in here is a constant byte pattern and every key is a published test vector —
// nothing in this file is real key material.

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import {
  buildTx,
  Encoding,
  encode,
  produceNameId,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk'

// The SDK does not export ./package.json, so find its root from the entry point.
const entry = createRequire(import.meta.url).resolve('@aeternity/aepp-sdk')
const root = entry.slice(
  0,
  entry.indexOf('/@aeternity/aepp-sdk/') + '/@aeternity/aepp-sdk/'.length,
)
const sdkVersion = JSON.parse(
  readFileSync(`${root}package.json`, 'utf8'),
).version

const fill = (byte, encoding) => encode(Buffer.alloc(32, byte), encoding)
const ak1 = fill(1, Encoding.AccountAddress)
const ak2 = fill(2, Encoding.AccountAddress)
const ct = fill(3, Encoding.ContractAddress)
const ok = fill(4, Encoding.OracleAddress)
const ch = fill(5, Encoding.Channel)
const cm = fill(6, Encoding.Commitment)
const st = fill(7, Encoding.State)
const oq = fill(8, Encoding.OracleQueryId)
const nm = produceNameId('test.chain')
const cb = encode(Buffer.from('cafe', 'hex'), Encoding.ContractBytearray)
const ba = encode(Buffer.from('hello'), Encoding.Bytearray)
const ss = encode(Buffer.from('0102', 'hex'), Encoding.StateTrees)
// A well-formed but empty TreesPoi entry: rlp([60, 1, [], [], [], [], [], []]).
// The entry schema itself is a separate workstream; the transaction layer only
// has to carry these bytes through unchanged.
const poi = Buffer.from('c83c01c0c0c0c0c0c0', 'hex')
const authFun = Buffer.alloc(32, 9)
const signature = Buffer.alloc(64, 0xab)

// Typed value wrappers, so the Rust side knows which `Value` variant to build.
const enc = (v) => ({ t: 'enc', v })
const text = (v) => ({ t: 'text', v })
const uint = (v) => ({ t: 'uint', v: String(v) })
const bytes = (v) => ({ t: 'bytes', v: Buffer.from(v).toString('hex') })
const list = (v) => ({ t: 'list', v })
const pointers = (v) => ({ t: 'pointers', v })
const ctVersion = (vm, abi) => ({ t: 'ctversion', v: { vm, abi } })

/** Turn the typed params back into what the reference builder wants. */
function plain(params) {
  const out = {}
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue
    const { t, v } = value
    switch (t) {
      case 'enc':
      case 'text':
        out[key] = v
        break
      case 'uint':
        // Enumeration fields in the reference reject anything but a JS number,
        // while amounts overflow one — so narrow only where it is lossless.
        out[key] = Number.isSafeInteger(Number(v)) ? Number(v) : v
        break
      case 'bytes':
        out[key] = Buffer.from(v, 'hex')
        break
      case 'list':
        out[key] = v.map((item) =>
          item.t === 'bytes' ? Buffer.from(item.v, 'hex') : item.v,
        )
        break
      case 'pointers':
        out[key] = v
        break
      case 'ctversion':
        out[key] = { vmVersion: v.vm, abiVersion: v.abi }
        break
      default:
        throw new Error(`unknown value type ${t}`)
    }
  }
  return out
}

const innerSpend = buildTx({
  tag: Tag.SpendTx,
  senderId: ak1,
  recipientId: ak2,
  amount: '1',
  fee: '16660000000000',
  nonce: 1,
  ttl: 0,
})
const innerSigned = buildTx({
  tag: Tag.SignedTx,
  signatures: [signature],
  encodedTx: innerSpend,
})
const offChain = buildTx({
  tag: Tag.ChannelOffChainTx,
  channelId: ch,
  round: 2,
  stateHash: st,
})

const cases = [
  [
    'spend, minimal',
    Tag.SpendTx,
    null,
    {
      senderId: enc(ak1),
      recipientId: enc(ak2),
      amount: uint(0),
      nonce: uint(1),
    },
  ],
  [
    'spend, every field set',
    Tag.SpendTx,
    null,
    {
      senderId: enc(ak1),
      recipientId: enc(ak2),
      amount: uint('1000000000000000000'),
      ttl: uint(500),
      nonce: uint(42),
      payload: enc(ba),
    },
  ],
  [
    'spend, to a contract',
    Tag.SpendTx,
    null,
    {
      senderId: enc(ak1),
      recipientId: enc(ct),
      amount: uint(1),
      nonce: uint(1),
    },
  ],
  [
    'spend, to a name',
    Tag.SpendTx,
    null,
    {
      senderId: enc(ak1),
      recipientId: enc(nm),
      amount: uint(1),
      nonce: uint(1),
    },
  ],
  [
    'signed tx',
    Tag.SignedTx,
    null,
    {
      signatures: list([bytes(signature)]),
      encodedTx: enc(innerSpend),
    },
  ],
  [
    'signed tx, two signatures',
    Tag.SignedTx,
    null,
    {
      signatures: list([bytes(signature), bytes(Buffer.alloc(64, 0xcd))]),
      encodedTx: enc(innerSpend),
    },
  ],
  [
    'name preclaim',
    Tag.NamePreclaimTx,
    null,
    {
      accountId: enc(ak1),
      nonce: uint(3),
      commitmentId: enc(cm),
    },
  ],
  [
    'name claim',
    Tag.NameClaimTx,
    null,
    {
      accountId: enc(ak1),
      nonce: uint(4),
      name: text('test.chain'),
      nameSalt: uint('12345'),
      nameFee: uint('200000000000000000000'),
    },
  ],
  [
    'name claim, default salt and minimum name fee',
    Tag.NameClaimTx,
    null,
    {
      accountId: enc(ak1),
      nonce: uint(4),
      name: text('averylongnamethatisc.chain'),
    },
  ],
  [
    'name update v1',
    Tag.NameUpdateTx,
    1,
    {
      accountId: enc(ak1),
      nonce: uint(5),
      nameId: enc(nm),
      pointers: pointers([{ key: 'account_pubkey', id: ak2 }]),
    },
  ],
  [
    'name update v1, explicit ttls and several pointers',
    Tag.NameUpdateTx,
    1,
    {
      accountId: enc(ak1),
      nonce: uint(5),
      nameId: enc(nm),
      nameTtl: uint(1000),
      pointers: pointers([
        { key: 'account_pubkey', id: ak2 },
        { key: 'oracle_pubkey', id: ok },
        { key: 'contract_pubkey', id: ct },
      ]),
      clientTtl: uint(120),
      ttl: uint(700),
    },
  ],
  [
    'name update v1, no pointers',
    Tag.NameUpdateTx,
    1,
    {
      accountId: enc(ak1),
      nonce: uint(5),
      nameId: enc(nm),
      pointers: pointers([]),
    },
  ],
  [
    'name update v2, id pointer',
    Tag.NameUpdateTx,
    2,
    {
      accountId: enc(ak1),
      nonce: uint(6),
      nameId: enc(nm),
      pointers: pointers([{ key: 'account_pubkey', id: ak2 }]),
    },
  ],
  [
    'name update v2, raw pointer',
    Tag.NameUpdateTx,
    2,
    {
      accountId: enc(ak1),
      nonce: uint(6),
      nameId: enc(nm),
      pointers: pointers([{ key: 'raw', id: ba }]),
    },
  ],
  [
    'name transfer',
    Tag.NameTransferTx,
    null,
    {
      accountId: enc(ak1),
      nonce: uint(7),
      nameId: enc(nm),
      recipientId: enc(ak2),
    },
  ],
  [
    'name revoke',
    Tag.NameRevokeTx,
    null,
    {
      accountId: enc(ak1),
      nonce: uint(8),
      nameId: enc(nm),
      fee: uint('16620000000000'),
    },
  ],
  [
    'contract create',
    Tag.ContractCreateTx,
    null,
    {
      ownerId: enc(ak1),
      nonce: uint(9),
      code: enc(cb),
      ctVersion: ctVersion(8, 3),
      deposit: uint(0),
      amount: uint(0),
      gasLimit: uint(76),
      gasPrice: uint('1000000000'),
      callData: enc(cb),
    },
  ],
  [
    'contract create, protocol default ctVersion',
    Tag.ContractCreateTx,
    null,
    {
      ownerId: enc(ak1),
      nonce: uint(9),
      code: enc(cb),
      amount: uint(1),
      gasLimit: uint(76),
      gasPrice: uint('1000000000'),
      callData: enc(cb),
    },
  ],
  [
    'contract call',
    Tag.ContractCallTx,
    null,
    {
      callerId: enc(ak1),
      nonce: uint(10),
      contractId: enc(ct),
      abiVersion: uint(3),
      amount: uint(0),
      gasLimit: uint(25000),
      gasPrice: uint('1000000000'),
      callData: enc(cb),
    },
  ],
  [
    'contract call, to a name',
    Tag.ContractCallTx,
    null,
    {
      callerId: enc(ak1),
      nonce: uint(10),
      contractId: enc(nm),
      amount: uint(7),
      gasLimit: uint(25000),
      gasPrice: uint('1000000000'),
      callData: enc(cb),
    },
  ],
  [
    'oracle register',
    Tag.OracleRegisterTx,
    null,
    {
      accountId: enc(ak1),
      nonce: uint(11),
      queryFormat: text('string'),
      responseFormat: text('string'),
      queryFee: uint(0),
    },
  ],
  [
    'oracle register, block ttl and fate abi',
    Tag.OracleRegisterTx,
    null,
    {
      accountId: enc(ak1),
      nonce: uint(11),
      queryFormat: text('int'),
      responseFormat: text('int'),
      queryFee: uint('1000'),
      oracleTtlType: uint(1),
      oracleTtlValue: uint(2000),
      ttl: uint(900),
      abiVersion: uint(3),
    },
  ],
  [
    'oracle extend',
    Tag.OracleExtendTx,
    null,
    {
      oracleId: enc(ok),
      nonce: uint(12),
      fee: uint('16000000000000'),
    },
  ],
  [
    'oracle query',
    Tag.OracleQueryTx,
    null,
    {
      senderId: enc(ak1),
      nonce: uint(13),
      oracleId: enc(ok),
      query: text('how?'),
      queryFee: uint('1000'),
      fee: uint('16000000000000'),
    },
  ],
  [
    'oracle query, every ttl explicit',
    Tag.OracleQueryTx,
    null,
    {
      senderId: enc(ak1),
      nonce: uint(13),
      oracleId: enc(ok),
      query: text('how?'),
      queryFee: uint('1000'),
      queryTtlType: uint(1),
      queryTtlValue: uint(100),
      responseTtlType: uint(0),
      responseTtlValue: uint(50),
      ttl: uint(800),
    },
  ],
  [
    'oracle respond',
    Tag.OracleRespondTx,
    null,
    {
      oracleId: enc(ok),
      nonce: uint(14),
      queryId: enc(oq),
      response: text('yes'),
    },
  ],
  [
    'channel create',
    Tag.ChannelCreateTx,
    null,
    {
      initiator: enc(ak1),
      initiatorAmount: uint('1000'),
      responder: enc(ak2),
      responderAmount: uint('1000'),
      channelReserve: uint('10'),
      lockPeriod: uint(3),
      initiatorDelegateIds: list([]),
      responderDelegateIds: list([]),
      stateHash: enc(st),
      nonce: uint(15),
    },
  ],
  [
    'channel create, with delegates',
    Tag.ChannelCreateTx,
    null,
    {
      initiator: enc(ak1),
      initiatorAmount: uint('1000'),
      responder: enc(ak2),
      responderAmount: uint('2000'),
      channelReserve: uint('10'),
      lockPeriod: uint(3),
      ttl: uint(600),
      fee: uint('17680000000000'),
      initiatorDelegateIds: list([enc(ak1)]),
      responderDelegateIds: list([enc(ct), enc(ok)]),
      stateHash: enc(st),
      nonce: uint(15),
    },
  ],
  [
    // The postable sibling of the case above: same shape, delegates that are
    // accounts. A node refuses a contract or an oracle as a delegate, so without
    // this the tag would have no accepted vector at all.
    'channel create, with account delegates',
    Tag.ChannelCreateTx,
    null,
    {
      initiator: enc(ak1),
      initiatorAmount: uint('1000'),
      responder: enc(ak2),
      responderAmount: uint('2000'),
      channelReserve: uint('10'),
      lockPeriod: uint(3),
      ttl: uint(600),
      initiatorDelegateIds: list([enc(ak1)]),
      responderDelegateIds: list([enc(ak2)]),
      stateHash: enc(st),
      nonce: uint(15),
    },
  ],
  [
    'channel deposit',
    Tag.ChannelDepositTx,
    null,
    {
      channelId: enc(ch),
      fromId: enc(ak1),
      amount: uint('500'),
      stateHash: enc(st),
      round: uint(4),
      nonce: uint(16),
    },
  ],
  [
    'channel withdraw',
    Tag.ChannelWithdrawTx,
    null,
    {
      channelId: enc(ch),
      toId: enc(ak1),
      amount: uint('500'),
      stateHash: enc(st),
      round: uint(5),
      nonce: uint(17),
    },
  ],
  [
    'channel close mutual',
    Tag.ChannelCloseMutualTx,
    null,
    {
      channelId: enc(ch),
      fromId: enc(ak1),
      initiatorAmountFinal: uint('900'),
      responderAmountFinal: uint('1100'),
      nonce: uint(18),
    },
  ],
  [
    'channel close solo',
    Tag.ChannelCloseSoloTx,
    null,
    {
      channelId: enc(ch),
      fromId: enc(ak1),
      payload: enc(offChain),
      poi: bytes(poi),
      nonce: uint(19),
    },
  ],
  [
    'channel slash',
    Tag.ChannelSlashTx,
    null,
    {
      channelId: enc(ch),
      fromId: enc(ak1),
      payload: enc(offChain),
      poi: bytes(poi),
      nonce: uint(20),
    },
  ],
  [
    'channel settle',
    Tag.ChannelSettleTx,
    null,
    {
      channelId: enc(ch),
      fromId: enc(ak1),
      initiatorAmountFinal: uint('900'),
      responderAmountFinal: uint('1100'),
      nonce: uint(21),
    },
  ],
  [
    'channel snapshot solo',
    Tag.ChannelSnapshotSoloTx,
    null,
    {
      channelId: enc(ch),
      fromId: enc(ak1),
      payload: enc(offChain),
      nonce: uint(22),
    },
  ],
  [
    'channel force progress',
    Tag.ChannelForceProgressTx,
    null,
    {
      channelId: enc(ch),
      fromId: enc(ak1),
      payload: enc(offChain),
      round: uint(6),
      update: enc(cb),
      stateHash: enc(st),
      offChainTrees: enc(ss),
      nonce: uint(23),
    },
  ],
  [
    'channel off-chain',
    Tag.ChannelOffChainTx,
    null,
    {
      channelId: enc(ch),
      round: uint(2),
      stateHash: enc(st),
    },
  ],
  [
    'ga attach',
    Tag.GaAttachTx,
    null,
    {
      ownerId: enc(ak1),
      nonce: uint(1),
      code: enc(cb),
      authFun: bytes(authFun),
      ctVersion: ctVersion(8, 3),
      fee: uint('78500000000000'),
      gasLimit: uint(1000),
      gasPrice: uint('1000000000'),
      callData: enc(cb),
    },
  ],
  [
    'ga meta',
    Tag.GaMetaTx,
    null,
    {
      gaId: enc(ak1),
      authData: enc(cb),
      abiVersion: uint(3),
      gasLimit: uint(5000),
      gasPrice: uint('1000000000'),
      tx: enc(innerSigned),
    },
  ],
  [
    'paying for',
    Tag.PayingForTx,
    null,
    {
      payerId: enc(ak1),
      nonce: uint(24),
      fee: uint('19340000000000'),
      tx: enc(innerSigned),
    },
  ],
]

/**
 * The Rust core requires an explicit fee — deriving one is the fee/gas model's
 * job and that is a separate workstream. So every case is pinned to a concrete
 * fee here: the reference's own computed minimum, obtained by building once with
 * the field omitted and reading it back. The recorded fee is then part of the
 * vector, and the corpus doubles as the expected output of that model.
 */
function pinFee(tag, version, params) {
  const base = { tag, ...(version != null ? { version } : {}) }
  const probe = buildTx({ ...base, ...plain({ ...params, fee: undefined }) })
  const minFee = unpackTx(probe).fee
  // SignedTx and ChannelOffChainTx carry no fee field at all.
  if (minFee == null) return params
  if (params.fee != null && BigInt(params.fee.v) >= BigInt(minFee))
    return params
  return { ...params, fee: uint(minFee) }
}

/**
 * Vectors whose bytes are correct and whose *transaction* a node will not take.
 *
 * A committed vector is an assertion about bytes; an accepted transaction is an
 * assertion about content, and the two part company here. Each of these was
 * reproduced with this same reference sdk both building and wrapping the
 * transaction, so none of them is a defect in the Rust core — they are the blind
 * spot an offline byte-diff has, and deleting them would delete the evidence.
 *
 * These are the only chain facts in this file, and they were not measured by the
 * sdk. They were measured against an `ae_uat` node by the parity harness, they
 * are recorded case by case in `crates/ae-parity/TESTNET.md`, and
 * `crates/ae-parity/node-exercise.mjs` re-measures every one of them on each run
 * and fails if reality has moved in either direction. A marking that nothing
 * re-checks is a marking that rots.
 *
 * `sibling` names the vector that gives the tag its acceptance result. `null`
 * means the tag has none, which is a finding against the tag rather than a hole
 * in the corpus, and is carried as a named exception by the harness.
 */
const nonPostable = {
  'name update v2, id pointer': {
    errorCode: 'broken_tx',
    rule:
      'the node accepts serialised version 2 only when a pointer needs it — a ' +
      'raw ba_ blob — and version 1 when none does. One encoding per content, ' +
      'enforced at decode. The reference sdk serialises whichever version the ' +
      'caller names.',
    sibling: 'name update v2, raw pointer',
  },
  'channel create, with delegates': {
    errorCode: 'broken_tx',
    rule: 'a channel delegate must be an account; this vector uses a contract and an oracle.',
    sibling: 'channel create, with account delegates',
  },
  'channel force progress': {
    errorCode: 'broken_tx',
    rule:
      'refused whatever it contains. Seven variants, crossing payload ' +
      'signedness, update-entry validity and off-chain-trees validity, were ' +
      'refused identically, so the cause is none of those fields.',
    sibling: null,
  },
}

const out = {
  note: 'Generated by generate-vectors.mjs. Do not hand-edit.',
  sdkVersion,
  cases: cases.map(([name, tag, version, rawParams]) => {
    const params = pinFee(tag, version, rawParams)
    const refused = nonPostable[name]
    return {
      name,
      tag,
      version,
      params,
      tx: buildTx({
        tag,
        ...(version != null ? { version } : {}),
        ...plain(params),
      }),
      postable: refused === undefined,
      ...(refused === undefined ? {} : { refusedBy: refused }),
    }
  }),
}

// A marking naming a vector that does not exist is worse than no marking: it
// reads as covered and asserts nothing.
for (const [name, entry] of Object.entries(nonPostable)) {
  if (!cases.some(([caseName]) => caseName === name)) {
    throw new Error(`non-postable marking names no such vector: ${name}`)
  }
  if (
    entry.sibling != null &&
    !cases.some(([caseName]) => caseName === entry.sibling)
  ) {
    throw new Error(
      `non-postable sibling names no such vector: ${entry.sibling}`,
    )
  }
}

process.stdout.write(`${JSON.stringify(out, null, 2)}\n`)
