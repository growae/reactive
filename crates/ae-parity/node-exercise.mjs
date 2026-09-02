// The on-node half of the parity harness.
//
//   cargo run -p ae-parity -- sign --out signed.json
//   node node-exercise.mjs --signed signed.json --out node.json
//   cargo run -p ae-parity -- matrix --node node.json
//
// An offline byte-diff proves we agree with the reference JavaScript sdk. It
// does not prove the node agrees with either of us, and the node is the
// authority — both implementations can be wrong in the same direction, and the
// state-tree entry schema already has two places where the protocol spec and the
// reference sdk disagree.
//
// Three measurements, in descending order of strength:
//
//   1. BUILT   The node has its own transaction builders behind `/v3/debug/…`,
//              written in Erlang against the protocol itself. Same parameters in,
//              and the bytes are compared to ours. This is a third independent
//              implementation, not a second opinion from the same family.
//   2. DECODED Every vector, rebuilt through the Rust core and signed by a key
//              generated for this run, posted to `/v3/transactions`. The node
//              rejects it — the account does not exist — but *which* rejection
//              says whether the decoder accepted our bytes.
//   3. CONTROL Deliberately corrupted transactions posted the same way. Without
//              these, measurement 2 is an assumption: it only means anything if a
//              broken transaction is rejected differently from a well-formed one.
//
// # Why this spends nothing
//
// Nothing here is ever included in a micro-block. The signer is generated per run
// and has never held a balance, so every posted transaction is rejected before it
// can reach the mempool — measurement 3 is also the proof of that, since it
// establishes that the rejections are real. The debug builders return bytes and
// touch no state. No key material in this repository is read or used.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The repository's lint rules allow `console.log` and nothing else, and a
// failure message belongs on stderr rather than stdout — where, for the
// generators these scripts drive, stdout is the corpus itself.
const stderr = (...parts) => process.stderr.write(`${parts.join(' ')}\n`)

const here = dirname(fileURLToPath(import.meta.url))
const crates = dirname(here)

const flag = (name, fallback) => {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1]
}

const base = flag('--node-url', 'https://testnet.aeternity.io/v3')
const signedPath = flag('--signed', join(here, 'signed.json'))
const outPath = flag('--out', join(here, 'node.json'))

const corpus = JSON.parse(
  readFileSync(join(crates, 'ae-core/tests/vectors/transactions.json'), 'utf8'),
)
const signed = JSON.parse(readFileSync(signedPath, 'utf8'))

/**
 * The corpus's own claim about which vectors a node refuses, and why.
 *
 * Everything below re-measures it. A marking that nothing re-checks is a marking
 * that rots: it silently removes a vector from the on-node clause and nobody
 * finds out when the chain rule it names stops applying. So this script fails in
 * **both** directions — a postable vector the node refuses, and a non-postable
 * vector the node takes.
 */
const refusedBy = new Map(
  corpus.cases
    .filter((entry) => entry.postable === false)
    .map((entry) => [entry.name, entry.refusedBy]),
)

/** base64check, the envelope every `tx_`-family string uses. */
function encodeCheck(prefix, bytes) {
  const first = createHash('sha256').update(bytes).digest()
  const check = createHash('sha256').update(first).digest().subarray(0, 4)
  return `${prefix}_${Buffer.concat([bytes, check]).toString('base64')}`
}

function decodeCheck(encoded) {
  const raw = Buffer.from(encoded.slice(encoded.indexOf('_') + 1), 'base64')
  return raw.subarray(0, raw.length - 4)
}

async function call(path, body) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { reason: text.slice(0, 200) }
  }
  return { status: response.status, body: json }
}

// ---------------------------------------------------------------------------
// 1. BUILT — the node's own builders
// ---------------------------------------------------------------------------

const plain = (value) => (value == null ? undefined : value.v)
const number = (value) => (value == null ? undefined : Number(value.v))
const big = (value) => (value == null ? undefined : Number(value.v))
const ttlObject = (type, value, fallbackValue) => {
  if (value == null) return fallbackValue
  return {
    type: Number(type?.v ?? 0) === 1 ? 'block' : 'delta',
    value: Number(value.v),
  }
}

/**
 * How each tag's corpus parameters map onto the node's own builder.
 *
 * `null` means the node has no builder for the tag, so it cannot speak for those
 * bytes at all and the row is reported as such rather than as a pass. A mapper
 * that throws reports why the shapes are not comparable — which is a finding
 * about the node's HTTP surface, not a parity failure.
 */
const builders = {
  SpendTx: {
    path: '/debug/transactions/spend',
    map: (p) => ({
      sender_id: plain(p.senderId),
      recipient_id: plain(p.recipientId),
      amount: big(p.amount),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
      payload: plain(p.payload) ?? 'ba_Xfbg4g==',
    }),
  },
  NamePreclaimTx: {
    path: '/debug/names/preclaim',
    map: (p) => ({
      account_id: plain(p.accountId),
      nonce: number(p.nonce),
      commitment_id: plain(p.commitmentId),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  NameClaimTx: {
    path: '/debug/names/claim',
    map: (p) => ({
      account_id: plain(p.accountId),
      nonce: number(p.nonce),
      name: plain(p.name),
      name_salt: big(p.nameSalt) ?? 0,
      name_fee: big(p.nameFee),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  NameUpdateTx: {
    path: '/debug/names/update',
    map: (p) => ({
      account_id: plain(p.accountId),
      nonce: number(p.nonce),
      name_id: plain(p.nameId),
      name_ttl: number(p.nameTtl) ?? 180000,
      client_ttl: number(p.clientTtl) ?? 3600,
      pointers: (p.pointers?.v ?? []).map((pointer) => ({
        key: pointer.key,
        id: pointer.id,
      })),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  NameTransferTx: {
    path: '/debug/names/transfer',
    map: (p) => ({
      account_id: plain(p.accountId),
      nonce: number(p.nonce),
      name_id: plain(p.nameId),
      recipient_id: plain(p.recipientId),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  NameRevokeTx: {
    path: '/debug/names/revoke',
    map: (p) => ({
      account_id: plain(p.accountId),
      nonce: number(p.nonce),
      name_id: plain(p.nameId),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  OracleRegisterTx: {
    path: '/debug/oracles/register',
    map: (p) => ({
      account_id: plain(p.accountId),
      nonce: number(p.nonce),
      query_format: plain(p.queryFormat),
      response_format: plain(p.responseFormat),
      query_fee: big(p.queryFee) ?? 0,
      oracle_ttl: ttlObject(p.oracleTtlType, p.oracleTtlValue, {
        type: 'delta',
        value: 500,
      }),
      abi_version: number(p.abiVersion) ?? 0,
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  OracleExtendTx: {
    path: '/debug/oracles/extend',
    map: (p) => ({
      oracle_id: plain(p.oracleId),
      nonce: number(p.nonce),
      oracle_ttl: ttlObject(p.oracleTtlType, p.oracleTtlValue, {
        type: 'delta',
        value: 500,
      }),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  OracleQueryTx: {
    path: '/debug/oracles/query',
    map: (p) => ({
      sender_id: plain(p.senderId),
      nonce: number(p.nonce),
      oracle_id: plain(p.oracleId),
      query: plain(p.query),
      query_fee: big(p.queryFee) ?? 0,
      query_ttl: ttlObject(p.queryTtlType, p.queryTtlValue, {
        type: 'delta',
        value: 10,
      }),
      response_ttl: ttlObject(p.responseTtlType, p.responseTtlValue, {
        type: 'delta',
        value: 10,
      }),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  OracleRespondTx: {
    path: '/debug/oracles/respond',
    map: (p) => ({
      oracle_id: plain(p.oracleId),
      nonce: number(p.nonce),
      query_id: plain(p.queryId),
      response: plain(p.response),
      response_ttl: ttlObject(p.responseTtlType, p.responseTtlValue, {
        type: 'delta',
        value: 10,
      }),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
    }),
  },
  ContractCreateTx: {
    path: '/debug/contracts/create',
    map: (p) => ({
      owner_id: plain(p.ownerId),
      nonce: number(p.nonce),
      code: plain(p.code),
      vm_version: p.ctVersion?.v.vm ?? 8,
      abi_version: p.ctVersion?.v.abi ?? 3,
      deposit: big(p.deposit) ?? 0,
      amount: big(p.amount) ?? 0,
      gas: big(p.gasLimit),
      gas_price: big(p.gasPrice),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      call_data: plain(p.callData),
    }),
  },
  ContractCallTx: {
    path: '/debug/contracts/call',
    map: (p) => ({
      caller_id: plain(p.callerId),
      nonce: number(p.nonce),
      contract_id: plain(p.contractId),
      abi_version: number(p.abiVersion) ?? 3,
      amount: big(p.amount) ?? 0,
      gas: big(p.gasLimit),
      gas_price: big(p.gasPrice),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      call_data: plain(p.callData),
    }),
  },
  ChannelCreateTx: {
    path: '/debug/channels/create',
    // The endpoint takes one `delegate_ids` list where the tag serialises two.
    // This used to refuse to send at all and declare the row not comparable in
    // prose. It now sends the closest request the endpoint can express and lets
    // the field comparison say so — the exclusion has to be earned by decoding
    // what comes back, not asserted by whoever wrote the mapper.
    map: (p) => ({
      initiator_id: plain(p.initiator),
      initiator_amount: big(p.initiatorAmount),
      responder_id: plain(p.responder),
      responder_amount: big(p.responderAmount),
      channel_reserve: big(p.channelReserve),
      lock_period: number(p.lockPeriod),
      state_hash: plain(p.stateHash),
      delegate_ids: [
        ...(p.initiatorDelegateIds?.v ?? []),
        ...(p.responderDelegateIds?.v ?? []),
      ].map((id) => id.v ?? id),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  ChannelDepositTx: {
    path: '/debug/channels/deposit',
    map: (p) => ({
      channel_id: plain(p.channelId),
      from_id: plain(p.fromId),
      amount: big(p.amount),
      state_hash: plain(p.stateHash),
      round: number(p.round),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  ChannelWithdrawTx: {
    path: '/debug/channels/withdraw',
    map: (p) => ({
      channel_id: plain(p.channelId),
      to_id: plain(p.toId),
      amount: big(p.amount),
      state_hash: plain(p.stateHash),
      round: number(p.round),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  ChannelCloseMutualTx: {
    path: '/debug/channels/close/mutual',
    map: (p) => ({
      channel_id: plain(p.channelId),
      from_id: plain(p.fromId),
      initiator_amount_final: big(p.initiatorAmountFinal),
      responder_amount_final: big(p.responderAmountFinal),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  ChannelCloseSoloTx: {
    path: '/debug/channels/close/solo',
    map: (p) => ({
      channel_id: plain(p.channelId),
      from_id: plain(p.fromId),
      payload: plain(p.payload),
      poi: encodeCheck('pi', Buffer.from(p.poi.v, 'hex')),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  ChannelSlashTx: {
    path: '/debug/channels/slash',
    map: (p) => ({
      channel_id: plain(p.channelId),
      from_id: plain(p.fromId),
      payload: plain(p.payload),
      poi: encodeCheck('pi', Buffer.from(p.poi.v, 'hex')),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  ChannelSettleTx: {
    path: '/debug/channels/settle',
    map: (p) => ({
      channel_id: plain(p.channelId),
      from_id: plain(p.fromId),
      initiator_amount_final: big(p.initiatorAmountFinal),
      responder_amount_final: big(p.responderAmountFinal),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  ChannelSnapshotSoloTx: {
    path: '/debug/channels/snapshot/solo',
    map: (p) => ({
      channel_id: plain(p.channelId),
      from_id: plain(p.fromId),
      payload: plain(p.payload),
      fee: big(p.fee),
      ttl: number(p.ttl) ?? 0,
      nonce: number(p.nonce),
    }),
  },
  PayingForTx: {
    path: '/debug/transactions/paying-for',
    map: (p) => ({
      payer_id: plain(p.payerId),
      nonce: number(p.nonce),
      fee: big(p.fee),
      tx: plain(p.tx),
    }),
  },
  // No builder on the node's HTTP surface. Not a gap in the core: `SignedTx` and
  // `ChannelOffChainTx` are not standalone endpoints, and the generalized-account
  // and force-progress builders were never exposed over HTTP.
  SignedTx: null,
  ChannelOffChainTx: null,
  ChannelForceProgressTx: null,
  GaAttachTx: null,
  GaMetaTx: null,
}

async function measureBuilders() {
  const ours = new Map(signed.cases.map((entry) => [entry.name, entry.built]))
  const tags = new Map(signed.cases.map((entry) => [entry.name, entry.tag]))
  const rows = []
  for (const entry of corpus.cases) {
    const name = entry.name
    const tag = tags.get(name)
    const builder = builders[tag]
    if (builder === undefined) {
      rows.push({
        name,
        tag,
        verdict: 'unclassified',
        detail: 'no entry in the builder table',
      })
      continue
    }
    if (builder === null) {
      rows.push({ name, tag, verdict: 'no-node-builder' })
      continue
    }
    // A vector the node has already said it will not take leaves the builder
    // comparison too. Asking whether it builds the same bytes for a transaction
    // it refuses scores a disagreement already recorded as the refusal.
    if (refusedBy.has(name)) {
      rows.push({ name, tag, verdict: 'excluded-non-postable' })
      continue
    }
    let body
    try {
      body = builder.map(entry.params)
    } catch (error) {
      rows.push({ name, tag, verdict: 'not-comparable', detail: error.message })
      continue
    }
    const { status, body: response } = await call(builder.path, body)
    if (status !== 200 || typeof response.tx !== 'string') {
      rows.push({
        name,
        tag,
        verdict: 'node-declined',
        detail: `HTTP ${status}: ${response.reason ?? JSON.stringify(response).slice(0, 160)}`,
      })
      continue
    }
    const mine = ours.get(name)
    rows.push({
      name,
      tag,
      // Provisional. Anything not byte-identical is classified below, by
      // decoding both sides rather than by anyone's judgement about the row.
      verdict: response.tx === mine ? 'identical' : 'pending-classification',
      ...(response.tx === mine ? {} : { ours: mine, node: response.tx }),
    })
  }
  return rows
}

// ---------------------------------------------------------------------------
// 1b. CLASSIFY — did the node build the transaction it was asked for?
// ---------------------------------------------------------------------------

/**
 * Decode `tx_` strings through `ae-core`, the decoder the corpus already proves
 * against the reference.
 *
 * Not reimplemented here on purpose. Decoding a transaction needs the tag schema,
 * and a JavaScript copy of 27 entries over 200 fields would be a mirror that
 * drifts the first time one of them changes — this workspace carries three such
 * mirrors already and does not need a fourth to answer one question.
 */
function unpackThroughCore(encoded) {
  if (encoded.length === 0) return []
  const scratch = mkdtempSync(join(tmpdir(), 'parity-unpack-'))
  try {
    const input = join(scratch, 'input.json')
    const output = join(scratch, 'output.json')
    writeFileSync(input, JSON.stringify(encoded))
    execFileSync(
      'cargo',
      [
        'run',
        '--quiet',
        '-p',
        'ae-parity',
        '--',
        'unpack',
        '--input',
        input,
        '--out',
        output,
      ],
      { cwd: crates, stdio: ['ignore', 'ignore', 'inherit'] },
    )
    return JSON.parse(readFileSync(output, 'utf8'))
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

/**
 * Turn every provisional row into a verdict, by decoding both sides.
 *
 * `not-comparable` means the node did not return the transaction it was asked
 * for, and it has to name the field that says so. `differs` therefore keeps
 * meaning what it says — same transaction, different bytes — and stays an
 * unconditional failure. Nothing is excused for being a quirk, and the day an
 * endpoint starts returning what it was given its row becomes comparable again
 * on its own.
 */
function classifyBuilders(rows) {
  const pending = rows.filter((row) => row.verdict === 'pending-classification')
  if (pending.length === 0) return rows

  const decoded = unpackThroughCore(
    pending.flatMap((row) => [row.ours, row.node]),
  )

  pending.forEach((row, index) => {
    const mine = decoded[index * 2]
    const theirs = decoded[index * 2 + 1]
    if (!mine?.ok || !theirs?.ok) {
      row.verdict = 'unclassified'
      row.detail =
        `could not decode: ${mine?.error ?? ''} ${theirs?.error ?? ''}`.trim()
      return
    }

    const differing = []
    if (mine.tag !== theirs.tag) {
      differing.push(`tag (sent ${mine.tag}, node ${theirs.tag})`)
    }
    if (mine.version !== theirs.version) {
      differing.push(`version (sent ${mine.version}, node ${theirs.version})`)
    }
    for (const field of new Set([
      ...Object.keys(mine.fields),
      ...Object.keys(theirs.fields),
    ])) {
      const sent = mine.fields[field]
      const back = theirs.fields[field]
      if (sent !== back) {
        differing.push(
          `${field} (sent ${sent ?? '<absent>'}, node ${back ?? '<absent>'})`,
        )
      }
    }

    if (differing.length > 0) {
      row.verdict = 'not-comparable'
      row.fields_differing = differing
      row.detail = `the endpoint returned a different transaction: ${differing.join('; ')}`
    } else {
      // Same transaction, different bytes. A real encoding disagreement.
      row.verdict = 'differs'
    }
  })

  return rows
}

// ---------------------------------------------------------------------------
// 1c. PROBE — is the pointer-order finding still true?
// ---------------------------------------------------------------------------

/**
 * The name-update endpoint reverses the pointer list. That is what takes one row
 * out of the byte comparison, so it is re-measured rather than assumed: three
 * orders in, and the endpoint has to fail to preserve every one of them.
 *
 * The probe exists for the direction nobody watches. If the endpoint is ever
 * fixed, this stops holding and the run fails loudly — rather than the row
 * staying quietly excluded on a finding that has expired.
 */
async function probePointerOrder() {
  const nameUpdate = corpus.cases.find(
    (entry) =>
      entry.name === 'name update v1, explicit ttls and several pointers',
  )
  if (nameUpdate === undefined)
    return { ran: false, reason: 'no multi-pointer vector' }

  const sent = nameUpdate.params.pointers.v.map((pointer) => pointer.key)
  const orders = [sent, [...sent].reverse(), [sent[1], sent[0], sent[2]]]
  const byKey = new Map(
    nameUpdate.params.pointers.v.map((pointer) => [pointer.key, pointer.id]),
  )

  const observations = []
  for (const order of orders) {
    const { status, body } = await call('/debug/names/update', {
      ...builders.NameUpdateTx.map(nameUpdate.params),
      pointers: order.map((key) => ({ key, id: byKey.get(key) })),
    })
    if (status !== 200 || typeof body.tx !== 'string') {
      observations.push({ sent: order, error: `HTTP ${status}` })
      continue
    }
    const [decoded] = unpackThroughCore([body.tx])
    const returned = decoded.ok
      ? decoded.fields.pointers
          .replace(/^\[|\]$/g, '')
          .split(',')
          .filter(Boolean)
          .map((pair) => pair.split('=')[0])
      : []
    observations.push({
      sent: order,
      returned,
      preserved: order.join(',') === returned.join(','),
    })
  }

  const preservesOrder = observations.some(
    (observation) => observation.preserved,
  )
  return { ran: true, observations, preservesOrder }
}

// ---------------------------------------------------------------------------
// 2 and 3. DECODED and CONTROL
// ---------------------------------------------------------------------------

/**
 * What each of the node's rejections tells us about our bytes.
 *
 * `broken_tx` is the only verdict that means the decoder refused them. Everything
 * past it — a signature check, a nonce check, a balance check — can only be
 * reached by a transaction the node fully decoded, so those are the accepting
 * outcomes even though they are all HTTP 400.
 */
const DECODER_REJECTED = new Set(['broken_tx', 'invalid_encoding'])

function classify(status, body) {
  if (status === 200) return { verdict: 'entered-mempool', code: null }
  const code = body.error_code ?? null
  if (code !== null && DECODER_REJECTED.has(code)) {
    return { verdict: 'decoder-rejected', code }
  }
  if (code !== null) return { verdict: 'decoder-accepted', code }
  return { verdict: 'unclassified', code: body.reason ?? null }
}

async function post(tx) {
  const { status, body } = await call('/transactions', { tx })
  return { ...classify(status, body), status, reason: body.reason ?? null }
}

async function measureAcceptance() {
  const rows = []
  for (const entry of signed.cases) {
    const refusal = refusedBy.get(entry.name) ?? null
    if (typeof entry.signed !== 'string') {
      rows.push({
        name: entry.name,
        tag: entry.tag,
        postable: refusal === null,
        verdict: 'not-built',
        code: entry.build_error,
      })
      continue
    }
    rows.push({
      name: entry.name,
      tag: entry.tag,
      postable: refusal === null,
      ...(refusal === null ? {} : { marked: refusal }),
      ...(await post(entry.signed)),
    })
  }
  return rows
}

async function measureControls() {
  const sample = signed.cases.find((entry) => typeof entry.signed === 'string')
  const body = decodeCheck(sample.signed)
  const flipped = Buffer.from(body)
  // Deep enough to land inside the wrapped transaction rather than in the
  // signature, so the corruption has to be caught by the decoder.
  const offset = Math.min(75, flipped.length - 1)
  flipped[offset] ^= 0xff

  const controls = {
    'truncated rlp': encodeCheck(
      'tx',
      body.subarray(0, Math.floor(body.length / 2)),
    ),
    'unknown transaction tag': encodeCheck(
      'tx',
      Buffer.from('c88203e701c0c0c0c0c0c0', 'hex'),
    ),
    'one flipped byte inside the wrapped transaction': encodeCheck(
      'tx',
      flipped,
    ),
    'broken envelope checksum': `${sample.signed.slice(0, -2)}${
      sample.signed.slice(-2) === 'AA' ? 'BB' : 'AA'
    }`,
  }

  const rows = []
  for (const [name, tx] of Object.entries(controls)) {
    rows.push({ name, ...(await post(tx)) })
  }
  return rows
}

// ---------------------------------------------------------------------------

const status = await (await fetch(`${base}/status`)).json()
console.log(
  `node ${status.node_version} on ${status.network_id}, height ${
    (await (await fetch(`${base}/key-blocks/current/height`)).json()).height
  }`,
)

const built = classifyBuilders(await measureBuilders())
const pointerOrder = await probePointerOrder()
const accepted = await measureAcceptance()
const controls = await measureControls()

const postableRejected = accepted
  .filter((row) => row.postable && row.verdict === 'decoder-rejected')
  .map((row) => `${row.name}: ${row.code}`)
// The other direction, and the one a marking makes easy to forget: a vector
// excused from the clause that the chain has since started accepting. The
// exclusion is then unearned, and an unearned exclusion is a vector quietly
// removed from the measurement.
const staleMarkings = accepted
  .filter((row) => row.postable === false && row.verdict === 'decoder-accepted')
  .map(
    (row) => `${row.name}: marked ${row.marked?.errorCode}, node accepted it`,
  )

const summary = {
  built: tally(built, 'verdict'),
  accepted: tally(accepted, 'verdict'),
  postable_accepted: accepted.filter(
    (row) => row.postable && row.verdict === 'decoder-accepted',
  ).length,
  postable_total: accepted.filter((row) => row.postable).length,
  postable_rejected: postableRejected,
  non_postable_excluded: accepted
    .filter((row) => row.postable === false)
    .map((row) => `${row.name}: ${row.code}`),
  stale_markings: staleMarkings,
  controls_all_rejected: controls.every(
    (row) => row.verdict === 'decoder-rejected',
  ),
  builder_differs: built
    .filter((row) => row.verdict === 'differs')
    .map((row) => row.name),
  builder_not_comparable: built
    .filter((row) => row.verdict === 'not-comparable')
    .map(
      (row) => `${row.name}: ${row.fields_differing?.join('; ') ?? row.detail}`,
    ),
  pointer_order_endpoint_preserves_order: pointerOrder.preservesOrder ?? null,
}

function tally(rows, key) {
  const out = {}
  for (const row of rows) out[row[key]] = (out[row[key]] ?? 0) + 1
  return out
}

const result = {
  node: {
    url: base,
    network_id: status.network_id,
    node_version: status.node_version,
  },
  signer: signed.signer,
  summary,
  pointer_order_probe: pointerOrder,
  built,
  accepted,
  controls,
}

writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
console.log(`written to ${outPath}`)

// The controls are the load-bearing part: if a deliberately broken transaction
// is not rejected as broken, the acceptance column above measured nothing.
if (!summary.controls_all_rejected) {
  stderr(
    'CONTROL FAILED — a corrupted transaction was not rejected by the decoder, ' +
      'so the acceptance results are not evidence of anything.',
  )
  process.exit(1)
}
// The endpoint that reverses a pointer list is why one row is not comparable.
// If it is ever fixed the row has to go back into the byte comparison, so this
// fails rather than letting the exclusion outlive the finding that earned it.
if (pointerOrder.ran && pointerOrder.preservesOrder) {
  stderr(
    'PROBE CHANGED — the name-update endpoint now preserves pointer order for at ' +
      'least one input. The row it excused is comparable again and the ' +
      'classification has to be re-derived:',
    `\n  ${JSON.stringify(pointerOrder.observations)}`,
  )
  process.exit(1)
}
if (summary.builder_differs.length > 0) {
  stderr(
    'CLAUSE 6 FAILED — the node built the same transaction with different bytes:',
    `\n  ${summary.builder_differs.join('\n  ')}`,
  )
  process.exit(1)
}
if (summary.postable_rejected.length > 0) {
  stderr(
    'CLAUSE 6 FAILED — a postable vector was refused by the decoder:',
    `\n  ${summary.postable_rejected.join('\n  ')}`,
  )
  process.exit(1)
}
if (summary.stale_markings.length > 0) {
  stderr(
    'STALE MARKING — a vector marked non-postable was accepted by the node. ' +
      'The exclusion is no longer earned; re-measure and drop the marking, or ' +
      'correct the rule it names:',
    `\n  ${summary.stale_markings.join('\n  ')}`,
  )
  process.exit(1)
}
if (summary.accepted['entered-mempool']) {
  stderr('A transaction entered the mempool. That must never happen here.')
  process.exit(1)
}
