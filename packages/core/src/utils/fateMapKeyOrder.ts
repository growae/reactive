/**
 * Whether `@aeternity/aepp-calldata` will serialise a `map` argument's keys in
 * an order the node's decoder refuses.
 *
 * The encoder sorts a map's entries itself, so the order a caller hands it is
 * discarded — there is nothing here to normalise, and this module deliberately
 * produces no bytes. It answers one question and returns the two orders when
 * they differ, so that the caller learns a named local error instead of a
 * mined transaction charged the whole gas limit.
 *
 * **Scoped to `string` and `bits` keys and no further.** Those are the two key
 * types where the two orders disagree; the rest of the protocol's total order
 * lives in `crates/ae-fate/src/ord.rs`, which is parity-verified, and
 * duplicating it here is what that crate exists to prevent.
 *
 * The asymmetry that makes this acceptable: a bug in this file yields a wrong
 * error message, never a wrong transaction.
 *
 * A cheaper predicate — *refuse any non-ASCII string key, or any two negative
 * `bits` keys* — is wrong and would break working code. `{"ä" → 1, "ö" → 2}`
 * encodes to `2b11d72a98011b2f0209c3a40209c3b604` and is accepted today: both
 * keys are one code unit and two bytes, so the encoder's order and the node's
 * coincide. So both orders are computed for the keys actually present and
 * compared, and only a real disagreement is a defect.
 */

const utf8 = new TextEncoder()

export type FateMapKeyType = 'string' | 'bits'

/** A `string` key as a JavaScript string, a `bits` key as a JavaScript bigint. */
export type FateMapKey = string | bigint

export type MapKeyOrderDisagreement = {
  keyType: FateMapKeyType
  /** The order `aeb_fate_data:lt/2` puts these keys in — the one the node accepts. */
  nodeOrder: readonly FateMapKey[]
  /** The order `@aeternity/aepp-calldata` will emit them in. */
  encoderOrder: readonly FateMapKey[]
}

// --- the node's order -----------------------------------------------------
// `aeb_fate_data:lt/2`, restricted to the two key types above. Twinned against
// the committed `node-order/…` vectors in
// `crates/ae-fate/tests/vectors/aepp-calldata-1.9.1-sweep.json`, which is the
// corpus `crates/ae-parity` scores; see `fateMapKeyOrder.test.ts`.

/** `aeb_fate_data:compare_bytes/2` — byte length first, then the bytes. */
function compareBytes(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) return a.length - b.length
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i]! - b[i]!
  }
  return 0
}

/**
 * `string` keys, the node's order: UTF-8 byte length first, then the UTF-8
 * bytes.
 */
export function compareStringKeysAsNode(a: string, b: string): number {
  return compareBytes(utf8.encode(a), utf8.encode(b))
}

/**
 * `bits` keys, the node's order: every non-negative before every negative,
 * then numerically within each sign.
 */
export function compareBitsKeysAsNode(a: bigint, b: bigint): number {
  const aNegative = a < 0n
  const bNegative = b < 0n
  if (aNegative !== bNegative) return aNegative ? 1 : -1
  return a < b ? -1 : a > b ? 1 : 0
}

// --- the encoder's order --------------------------------------------------
// A transcription of `FateComparator` at `@aeternity/aepp-calldata` 1.9.1, not
// a description of it: the quirks below are reproduced rather than corrected,
// because the question this module asks is what that file will actually do.
//
// The transcription is pinned to the installed library by
// `fateMapKeyOrder.reference.test.ts`, which encodes with it and reads the key
// order back out of the bytes. That package is transitive — it arrives through
// `@aeternity/aepp-sdk` — so an upstream fix lands on a lockfile refresh with
// no manifest change to review, and would leave these two functions describing
// an encoder that no longer exists. They would then refuse calls the node had
// started accepting. Any edit here that is not also true of the installed
// library fails that test.

/**
 * `listComparator` applied to two byte arrays, which is how the reference
 * compares two strings of equal UTF-16 length.
 *
 * The `a.length === 0` branch answers `-1` even when `b` is empty too, so the
 * reference's comparator is not antisymmetric there. It is kept because a
 * faithful transcription is the point; it is also unreachable for map keys,
 * since a map holds `""` at most once and no key is ever compared with itself.
 */
function compareBytesAsList(a: Uint8Array, b: Uint8Array): number {
  if (a.length === 0) return -1
  if (b.length === 0) return 1
  for (let i = 0; i < a.length; i += 1) {
    if (b[i] === undefined) return 1
    const difference = a[i]! - b[i]!
    if (difference !== 0) return difference
  }
  if (a.length === b.length) return 0
  return -1
}

/**
 * `string` keys, the encoder's order: `String.length` — UTF-16 code units —
 * first, then the UTF-8 bytes. An all-ASCII key set cannot tell the two orders
 * apart, because that is exactly where a string's byte length and its UTF-16
 * length coincide.
 */
export function compareStringKeysAsEncoder(a: string, b: string): number {
  if (a.length === b.length) {
    return compareBytesAsList(utf8.encode(a), utf8.encode(b))
  }
  return a.length - b.length
}

/**
 * `bits` keys, the encoder's order: the whole numeric comparison is negated as
 * soon as either operand is negative. That restores the node's
 * non-negative-before-negative boundary by accident and inverts the negative
 * half.
 *
 * The reference computes `Number(BigInt(a) - BigInt(b))`; only the sign of that
 * is observable through `Array.prototype.sort`, so the sign is what is
 * reproduced here and the difference is never narrowed to a `Number`.
 */
export function compareBitsKeysAsEncoder(a: bigint, b: bigint): number {
  const numeric = a < b ? -1 : a > b ? 1 : 0
  return a < 0n || b < 0n ? -numeric : numeric
}

// --- the predicate --------------------------------------------------------

const comparators = {
  string: {
    node: compareStringKeysAsNode as (a: FateMapKey, b: FateMapKey) => number,
    encoder: compareStringKeysAsEncoder as (
      a: FateMapKey,
      b: FateMapKey,
    ) => number,
  },
  bits: {
    node: compareBitsKeysAsNode as (a: FateMapKey, b: FateMapKey) => number,
    encoder: compareBitsKeysAsEncoder as (
      a: FateMapKey,
      b: FateMapKey,
    ) => number,
  },
} as const

/**
 * The order the node accepts for these keys, and the order the encoder will
 * emit them in — or `null` when the two agree and the call is fine.
 */
export function detectMapKeyOrderDisagreement(
  keys: readonly FateMapKey[],
  keyType: FateMapKeyType,
): MapKeyOrderDisagreement | null {
  // One key cannot be out of order, and the encoder writes an empty map as a
  // tag of its own.
  if (keys.length < 2) return null

  const { node, encoder } = comparators[keyType]
  const nodeOrder = [...keys].sort(node)
  const encoderOrder = [...keys].sort(encoder)

  for (let i = 0; i < nodeOrder.length; i += 1) {
    if (nodeOrder[i] !== encoderOrder[i]) {
      return { keyType, nodeOrder, encoderOrder }
    }
  }
  return null
}
