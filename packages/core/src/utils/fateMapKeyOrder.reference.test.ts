import { createRequire } from 'node:module'
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
 * The encoder half of `fateMapKeyOrder.ts`, run against the encoder itself.
 *
 * `compareStringKeysAsEncoder` and `compareBitsKeysAsEncoder` are a hand
 * transcription of `FateComparator` from `@aeternity/aepp-calldata`. Every
 * other test of them asserts against constants measured from that library once
 * and written down — which checks the transcription against the notes it was
 * transcribed from, and would keep passing after the day the notes stop being
 * true.
 *
 * That day is a lockfile refresh. `@aeternity/aepp-calldata` is not a direct
 * dependency of any package here; it arrives through `@aeternity/aepp-sdk`, so
 * a fixed upstream release lands with no manifest change to review. When it
 * does, the guard would go on refusing calls the node has started accepting —
 * a false refusal, which is the regression class the guard exists to prevent —
 * and nothing would say so.
 *
 * So this file encodes with the installed reference and reads the key order
 * back out of the bytes. A fixed upstream fails here, loudly, on the bump.
 */

// --- the installed reference ----------------------------------------------
// It is transitive, so a bare `import '@aeternity/aepp-calldata'` does not
// resolve from this package under pnpm's strict layout. Resolving it from the
// sdk's own entry point is not a workaround for that but the point: it pins
// the copy `@aeternity/aepp-sdk` will itself load, which is the one that
// encodes a real `callContract` argument. A hoisted or top-level copy could
// differ from it; this cannot.
//
// `require` gets `cjs/main.cjs` where an `import` would get `src/main.js`. The
// two are one Babel build apart, published from the same tarball and the same
// source, and what is under test here — the order `Array.prototype.sort`
// produces from `FateComparator` — is identical in both.

type OpaqueFateType = object

type CalldataReference = {
  TypeResolver: new () => {
    resolveType(type: unknown): OpaqueFateType
  }
  ContractByteArrayEncoder: new () => {
    encodeWithType(value: unknown, type: OpaqueFateType): string
    decodeWithType(data: string, type: OpaqueFateType): unknown
  }
}

const requireHere = createRequire(import.meta.url)
const requireFromSdk = createRequire(requireHere.resolve('@aeternity/aepp-sdk'))
const { ContractByteArrayEncoder, TypeResolver } = requireFromSdk(
  '@aeternity/aepp-calldata',
) as CalldataReference

const encoder = new ContractByteArrayEncoder()
const resolver = new TypeResolver()

// The aci-shaped type literals `callContract` already hands the sdk, resolved
// through the reference's own public resolver rather than built by hand.
const stringMapType = resolver.resolveType({ map: ['string', 'int'] })
const bitsMapType = resolver.resolveType({ map: ['bits', 'int'] })

/**
 * The order the reference actually writes these keys in.
 *
 * The encoder discards the insertion order and sorts the entries itself, and a
 * decoded `Map` preserves the order the bytes carried — so a round trip is
 * what makes that order observable. Each key is paired with its index in the
 * input so a decode that dropped or confused a key cannot read as a reorder.
 */
function emittedKeyOrder<key extends FateMapKey>(
  keys: readonly key[],
  type: OpaqueFateType,
): key[] {
  const decoded = encoder.decodeWithType(
    encoder.encodeWithType(
      new Map(keys.map((key, index) => [key, index])),
      type,
    ),
    type,
  )
  if (!(decoded instanceof Map))
    throw new Error(`the reference decoded a map to ${typeof decoded}`)

  const emitted = [...decoded.keys()] as key[]
  // Same keys, some order — asserted here so that every assertion downstream
  // is about order alone.
  expect(new Set(emitted)).toEqual(new Set(keys))
  expect(emitted).toHaveLength(keys.length)
  return emitted
}

// --- the corpus -----------------------------------------------------------

/** ASCII, two-byte, three-byte and astral — one and two utf-16 units. */
const ALPHABET = [
  'a',
  'b',
  'z',
  '0',
  '~',
  'ä',
  'ö',
  'ß',
  'ю',
  '€',
  '名',
  '前',
  'あ',
  '🚀',
  '🎉',
]

/** mulberry32 — seeded, so the sweep is a fixture and never a flake. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomString(random: () => number): string {
  const length = Math.floor(random() * 5)
  let value = ''
  for (let i = 0; i < length; i += 1)
    value += ALPHABET[Math.floor(random() * ALPHABET.length)]!
  return value
}

/** Signed, spanning 25 orders of magnitude. */
function randomBits(random: () => number): bigint {
  const magnitude =
    BigInt(Math.floor(random() * 2 ** 32)) *
    10n ** BigInt(Math.floor(random() * 25))
  return random() < 0.5 ? -magnitude : magnitude
}

/** Distinct keys, since a map holds each of them at most once. */
function keySets<key extends FateMapKey>(
  count: number,
  seed: number,
  draw: (random: () => number) => key,
): key[][] {
  const random = makeRandom(seed)
  const sets: key[][] = []
  while (sets.length < count) {
    const size = 2 + Math.floor(random() * 5)
    const keys = new Set<key>()
    for (let i = 0; i < size; i += 1) keys.add(draw(random))
    if (keys.size >= 2) sets.push([...keys])
  }
  return sets
}

// --- the assertions -------------------------------------------------------

/**
 * One key set, checked from both sides: the transcription reproduces the
 * reference exactly, and the guard's verdict about that key set is the truth.
 *
 * A guard that says nothing must be right that nothing is wrong — the encoder
 * really did emit the node's order — and a guard that refuses must be refusing
 * an order the reference really writes. Those are the false-accept and the
 * false-refusal, and neither is visible from the transcription alone.
 */
function checkKeySet<key extends FateMapKey>(
  keys: readonly key[],
  keyType: 'string' | 'bits',
  type: OpaqueFateType,
  asEncoder: (a: key, b: key) => number,
  asNode: (a: key, b: key) => number,
): void {
  const emitted = emittedKeyOrder(keys, type)
  expect(emitted).toEqual([...keys].sort(asEncoder))

  const disagreement = detectMapKeyOrderDisagreement(keys, keyType)
  if (disagreement === null) {
    expect(emitted).toEqual([...keys].sort(asNode))
  } else {
    expect(disagreement.encoderOrder).toEqual(emitted)
    expect(disagreement.nodeOrder).not.toEqual(emitted)
  }
}

const checkStringKeys = (keys: readonly string[]) =>
  checkKeySet(
    keys,
    'string',
    stringMapType,
    compareStringKeysAsEncoder,
    compareStringKeysAsNode,
  )

const checkBitsKeys = (keys: readonly bigint[]) =>
  checkKeySet(
    keys,
    'bits',
    bitsMapType,
    compareBitsKeysAsEncoder,
    compareBitsKeysAsNode,
  )

describe('the encoder transcription, against the installed reference', () => {
  it('reproduces the two shapes the guard was built for', () => {
    // The constants the rest of the suite asserts against, taken here from the
    // library rather than from the notes: `{"ä" → _, "xy" → _}` is written
    // `"ä"` first and `{-1 → _, -5 → _}` is written `-1` first, both of which
    // are the orders the node's decoder refuses.
    expect(emittedKeyOrder(['ä', 'xy'], stringMapType)).toEqual(['ä', 'xy'])
    expect(emittedKeyOrder([-1n, -5n], bitsMapType)).toEqual([-1n, -5n])

    checkStringKeys(['ä', 'xy'])
    checkBitsKeys([-1n, -5n])
  })

  it('reproduces the committed node-order vectors from the other side', () => {
    // The two key sets `crates/ae-fate` had to write by hand because the
    // reference cannot produce them. What it produces instead is asserted
    // here, so the pair of files describes both orders of the same keys.
    checkStringKeys([
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
    ])
    checkBitsKeys([-1n, -2n, -5n, -64n, -255n, 0n, 1n, 7n])
  })

  it('reproduces the key sets the guard deliberately accepts', () => {
    // A false refusal is the expensive failure, so the sets the guard passes
    // are pinned against the reference too, not only the ones it refuses.
    checkStringKeys(['ä', 'ö'])
    checkStringKeys(['ab', 'xy', 'zzz'])
    checkStringKeys(['', 'a', 'ab'])
    checkStringKeys(['ä', '€'])
    checkBitsKeys([0n, 1n, 7n])
    checkBitsKeys([0n, 1n, -5n])
    checkBitsKeys([2n ** 80n, 0n])
  })

  it('reproduces 2000 randomised string key sets', () => {
    for (const keys of keySets(2000, 0x5ea50, randomString))
      checkStringKeys(keys)
  })

  it('reproduces 2000 randomised bits key sets', () => {
    for (const keys of keySets(2000, 0xb1751, randomBits)) checkBitsKeys(keys)
  })
})
