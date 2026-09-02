import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  compareBitsKeysAsEncoder,
  compareBitsKeysAsNode,
  compareStringKeysAsEncoder,
  compareStringKeysAsNode,
  detectMapKeyOrderDisagreement,
  type FateMapKey,
} from './fateMapKeyOrder'

/**
 * The corpus this file is twinned against is the round-trip sweep committed for
 * `crates/ae-fate`, which `crates/ae-parity` scores as its FATE evidence. Two of
 * its 523 vectors are named `node-order/…` because the reference encoder cannot
 * produce them — they are exactly the two shapes where its order and the node's
 * disagree — so their key order is the node's, and reproducing it here is the
 * whole assertion this detector needs.
 *
 * Reading the committed bytes rather than a corpus written beside the detector
 * is deliberate: a hand-written corpus would be twinned against the same
 * reasoning it is meant to check.
 */
const SWEEP = JSON.parse(
  readFileSync(
    new URL(
      '../../../../crates/ae-fate/tests/vectors/aepp-calldata-1.9.1-sweep.json',
      import.meta.url,
    ),
    'utf8',
  ),
) as { vectors: { name: string; hex: string }[] }

function vector(name: string): Uint8Array {
  const found = SWEEP.vectors.find((v) => v.name === name)
  if (!found) throw new Error(`no vector named ${name} in the sweep corpus`)
  return Uint8Array.from(
    found.hex.match(/../g)!.map((byte) => Number.parseInt(byte, 16)),
  )
}

// --- just enough of the wire format to read those two vectors -------------
// Tags from `@aeternity/aepp-calldata`'s `FateTag.js`, which mirrors the
// protocol's own scheme. Only the four forms the two vectors use are handled;
// anything else throws rather than guessing, so a corpus that changed shape
// fails here loudly instead of decoding to something plausible.

const TAG_MAP = 0x2f
const TAG_POS_BITS = 0x4f
const TAG_NEG_BITS = 0xcf
const TAG_EMPTY_STRING = 0x5f
const TAG_LONG_STRING = 0x01

function readRlpInt(bytes: Uint8Array, at: number): [bigint, number] {
  const first = bytes[at]!
  if (first < 0x80) return [BigInt(first), at + 1]
  if (first > 0xb7) throw new Error(`unsupported RLP prefix 0x${first}`)
  const length = first - 0x80
  let value = 0n
  for (let i = 0; i < length; i += 1)
    value = (value << 8n) | BigInt(bytes[at + 1 + i]!)
  return [value, at + 1 + length]
}

function readValue(bytes: Uint8Array, at: number): [FateMapKey, number] {
  const tag = bytes[at]!
  // `sxxxxxx0` — a six bit integer with its sign in the top bit. It is the only
  // form with an even tag byte, so this test needs no other disambiguation.
  if ((tag & 1) === 0) {
    const magnitude = BigInt((tag >> 1) & 0x3f)
    return [(tag & 0x80) === 0 ? magnitude : -magnitude, at + 1]
  }
  if (tag === TAG_EMPTY_STRING) return ['', at + 1]
  if (tag !== TAG_LONG_STRING && (tag & 0b11) === 0b01) {
    const size = tag >> 2
    return [
      new TextDecoder().decode(bytes.subarray(at + 1, at + 1 + size)),
      at + 1 + size,
    ]
  }
  if (tag === TAG_POS_BITS) {
    const [value, next] = readRlpInt(bytes, at + 1)
    return [value, next]
  }
  if (tag === TAG_NEG_BITS) {
    const [value, next] = readRlpInt(bytes, at + 1)
    return [-value, next]
  }
  throw new Error(`unsupported FATE tag 0x${tag.toString(16)}`)
}

/** The `(key, value)` pairs of a serialised map, in the order they were written. */
function readMap(bytes: Uint8Array): [FateMapKey, FateMapKey][] {
  if (bytes[0] !== TAG_MAP) throw new Error('not a map')
  const [size, start] = readRlpInt(bytes, 1)
  const entries: [FateMapKey, FateMapKey][] = []
  let at = start
  for (let i = 0n; i < size; i += 1n) {
    const [key, afterKey] = readValue(bytes, at)
    const [value, afterValue] = readValue(bytes, afterKey)
    entries.push([key, value])
    at = afterValue
  }
  expect(at).toBe(bytes.length)
  return entries
}

describe('fateMapKeyOrder — twinned against the committed node-order vectors', () => {
  it('reproduces the node order of node-order/map/utf8-string-keys', () => {
    const entries = readMap(vector('node-order/map/utf8-string-keys'))
    const keys = entries.map(([key]) => key as string)

    // The generator's declared key set, in its own order: the value beside each
    // key is that key's index in this list, so the pairs pin which key is which
    // as well as the order they were written in.
    const declared = [
      'ä',
      'xy',
      'café',
      'uber',
      '名前',
      'name',
      '€',
      'USD',
      '🚀',
      'abcd',
    ]
    expect(entries.map(([, value]) => declared[Number(value)])).toEqual(keys)

    expect([...keys].sort(compareStringKeysAsNode)).toEqual(keys)
    expect([...keys].sort(compareStringKeysAsEncoder)).not.toEqual(keys)

    const disagreement = detectMapKeyOrderDisagreement(keys, 'string')
    expect(disagreement?.nodeOrder).toEqual(keys)
  })

  it('reproduces the node order of node-order/map/negative-bits-keys', () => {
    const entries = readMap(vector('node-order/map/negative-bits-keys'))
    const keys = entries.map(([key]) => key as bigint)

    const declared = [-1n, -2n, -5n, -64n, -255n, 0n, 1n, 7n]
    expect(entries.map(([, value]) => declared[Number(value)])).toEqual(keys)
    expect(keys).toEqual([0n, 1n, 7n, -255n, -64n, -5n, -2n, -1n])

    expect([...keys].sort(compareBitsKeysAsNode)).toEqual(keys)
    expect([...keys].sort(compareBitsKeysAsEncoder)).not.toEqual(keys)

    const disagreement = detectMapKeyOrderDisagreement(keys, 'bits')
    expect(disagreement?.nodeOrder).toEqual(keys)
  })
})

describe('fateMapKeyOrder — the encoder half, against measured output', () => {
  // These are constants measured from `@aeternity/aepp-calldata` once and
  // written down, so on their own they check the transcription against the
  // notes it was transcribed from. The same two shapes are asserted against
  // the installed library itself in `fateMapKeyOrder.reference.test.ts`, which
  // is what makes an upstream fix fail rather than pass silently.

  // `@aeternity/aepp-calldata` 1.9.1 writes `{"ä" → 1, "xy" → 2}` as
  // `2f0209c3a40209787904` — `"ä"` first. Measured on the node in
  // `test/integration/MAP-ORDER.md` and asserted from the other side in
  // `crates/ae-fate/tests/divergence.rs`.
  it('orders string keys by UTF-16 length, not byte length', () => {
    expect(['ä', 'xy'].sort(compareStringKeysAsEncoder)).toEqual(['ä', 'xy'])
    expect(['ä', 'xy'].sort(compareStringKeysAsNode)).toEqual(['xy', 'ä'])
  })

  // It writes `{-1 → 1, -5 → 2}` as `2f02cf0102cf0504` — `-1` first.
  it('inverts the negative half of the bits order', () => {
    expect([-1n, -5n].sort(compareBitsKeysAsEncoder)).toEqual([-1n, -5n])
    expect([-1n, -5n].sort(compareBitsKeysAsNode)).toEqual([-5n, -1n])
  })

  it('puts non-negative bits before negative ones in both orders', () => {
    expect([-1n, 0n, 7n].sort(compareBitsKeysAsEncoder)).toEqual([0n, 7n, -1n])
    expect([-1n, 0n, 7n].sort(compareBitsKeysAsNode)).toEqual([0n, 7n, -1n])
  })
})

describe('detectMapKeyOrderDisagreement', () => {
  it('does not refuse the keys the encoder gets right', () => {
    // The counter-example that kills the cheap "any non-ASCII key" predicate:
    // both keys are one code unit and two bytes, so the two orders coincide and
    // `{"ä" → 1, "ö" → 2}` is accepted by the node today. Refusing it would be
    // a regression shipped to fix a defect.
    expect(detectMapKeyOrderDisagreement(['ä', 'ö'], 'string')).toBeNull()
    expect(
      detectMapKeyOrderDisagreement(['ab', 'xy', 'zzz'], 'string'),
    ).toBeNull()
    expect(detectMapKeyOrderDisagreement(['', 'a', 'ab'], 'string')).toBeNull()
    // One code unit each, two and three bytes: the encoder falls through to a
    // byte comparison and the node's shorter-first rule agrees with it.
    expect(detectMapKeyOrderDisagreement(['ä', '€'], 'string')).toBeNull()
  })

  it('does not refuse bits keys the encoder gets right', () => {
    // Only the boundary between the signs is inverted by accident, so a key set
    // with at most one negative cannot disagree.
    expect(detectMapKeyOrderDisagreement([0n, 1n, 7n], 'bits')).toBeNull()
    expect(detectMapKeyOrderDisagreement([0n, 1n, -5n], 'bits')).toBeNull()
    expect(detectMapKeyOrderDisagreement([2n ** 80n, 0n], 'bits')).toBeNull()
  })

  it('reports both orders when they disagree', () => {
    expect(detectMapKeyOrderDisagreement(['ä', 'xy'], 'string')).toEqual({
      keyType: 'string',
      nodeOrder: ['xy', 'ä'],
      encoderOrder: ['ä', 'xy'],
    })
    expect(detectMapKeyOrderDisagreement([-1n, -2n], 'bits')).toEqual({
      keyType: 'bits',
      nodeOrder: [-2n, -1n],
      encoderOrder: [-1n, -2n],
    })
  })

  it('has nothing to say about fewer than two keys', () => {
    expect(detectMapKeyOrderDisagreement([], 'string')).toBeNull()
    expect(detectMapKeyOrderDisagreement(['ä'], 'string')).toBeNull()
    expect(detectMapKeyOrderDisagreement([-1n], 'bits')).toBeNull()
  })
})
