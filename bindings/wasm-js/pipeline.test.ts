import { describe, expect, it } from 'vitest'

// Exercises a jco-transpiled output — the committed one by default, or
// WASM_GENERATED_DIR when the CI gate points this at the committed
// core-harness.core.wasm specifically, to prove it is still functionally
// current without requiring it to byte-match a fresh build (rustc's LTO
// ordering for the ae-core path-dependency is not reproducible across
// checkout directories even with --remap-path-prefix on every path that
// shows up as a string — see .github/workflows/wasm-bindings.yml). CI has no
// Rust toolchain otherwise (see .github/workflows/ci.yml). Regenerate
// `generated/` via `pnpm build` here whenever wit/ or core-component/ change,
// and commit the result.
//
// This is this directory's own pipeline smoke test, and its only consumer.
// It is not the differential parity suite — that lives in crates/ae-parity,
// which links ae-core and ae-fate directly as Rust crates and never crosses a
// WASM boundary. All this proves is that the wasm32-unknown-unknown + jco
// round trip holds for the real ae-core surface, the same way the
// placeholder's `ping` proved it for an empty one.
const generatedDir = process.env.WASM_GENERATED_DIR ?? './generated'
const mod = await import(`${generatedDir}/core-harness.js`)
const { encoding, hash, keys, tx, aens, fee } = mod

const NETWORK_ID = 'ae_uat'
const SEED = new Uint8Array(32).fill(7)

describe('encoding', () => {
  it('round-trips an address through encode/decode/decode-any', () => {
    const raw = new Uint8Array(32).fill(1)
    const address = encoding.encode(raw, 'ak')
    expect(address.startsWith('ak_')).toBe(true)
    expect(encoding.decode(address)).toEqual(raw)
    const [prefix, bytes] = encoding.decodeAny(address)
    expect(prefix).toBe('ak')
    expect(bytes).toEqual(raw)
  })
})

describe('hash', () => {
  it('hashes to 32 bytes', () => {
    expect(hash.blake2b256(new Uint8Array([1, 2, 3])).length).toBe(32)
    expect(hash.sha256(new Uint8Array([1, 2, 3])).length).toBe(32)
  })
})

describe('keys', () => {
  it('derives the same address twice from the same seed', () => {
    const [secretA, addressA] = keys.fromSeed(SEED)
    const [secretB, addressB] = keys.fromSeed(SEED)
    expect(secretA).toBe(secretB)
    expect(addressA).toBe(addressB)
    expect(keys.addressFromSecret(secretA)).toBe(addressA)
  })

  it('signs and verifies a message', () => {
    const [secret, address] = keys.fromSeed(SEED)
    const signature = keys.signMessage(secret, 'hello æternity')
    expect(keys.verifyMessage('hello æternity', signature, address)).toBe(true)
    expect(keys.verifyMessage('tampered', signature, address)).toBe(false)
  })
})

describe('tx + aens + fee, end to end', () => {
  it('builds, signs, wraps and hashes a SpendTx', () => {
    const [secret, sender] = keys.fromSeed(SEED)
    const [, recipient] = keys.fromSeed(new Uint8Array(32).fill(9))

    const unsigned = tx.build('SpendTx', undefined, [
      { key: 'senderId', value: { tag: 'encoded', val: sender } },
      { key: 'recipientId', value: { tag: 'encoded', val: recipient } },
      { key: 'amount', value: { tag: 'uint', val: '1000000000000000000' } },
      { key: 'fee', value: { tag: 'uint', val: '16660000000000' } },
      { key: 'ttl', value: { tag: 'uint', val: '0' } },
      { key: 'nonce', value: { tag: 'uint', val: '1' } },
    ])
    expect(unsigned.startsWith('tx_')).toBe(true)

    const [tag, , fields] = tx.unpack(unsigned)
    expect(tag).toBe('SpendTx')
    expect(fields.find((f) => f.key === 'amount')?.value).toEqual({
      tag: 'uint',
      val: '1000000000000000000',
    })

    const signature = keys.signTransaction(secret, unsigned, NETWORK_ID, false)
    expect(signature.startsWith('sg_')).toBe(true)

    const signed = tx.wrapSigned([encoding.decode(signature)], unsigned)
    expect(signed.startsWith('tx_')).toBe(true)

    const [signatures, innerTx] = tx.unpackSigned(signed)
    expect(signatures.length).toBe(1)
    expect(innerTx).toBe(unsigned)

    const hashed = tx.transactionHash(signed)
    expect(hashed.startsWith('th_')).toBe(true)
  })

  it('estimates gas/fee consistently with a built transaction size', () => {
    const [, sender] = keys.fromSeed(SEED)
    const built = tx.build('SpendTx', undefined, [
      { key: 'senderId', value: { tag: 'encoded', val: sender } },
      { key: 'recipientId', value: { tag: 'encoded', val: sender } },
      { key: 'amount', value: { tag: 'uint', val: '1' } },
      { key: 'fee', value: { tag: 'uint', val: '16660000000000' } },
      { key: 'ttl', value: { tag: 'uint', val: '0' } },
      { key: 'nonce', value: { tag: 'uint', val: '1' } },
    ])
    const size = encoding.decode(built).length
    const gas = fee.estimateGas('SpendTx', size, 1, 0, undefined)
    expect(gas).toBeGreaterThan(0n)
    const minFee = fee.feeForGas(gas)
    expect(BigInt(minFee)).toBeGreaterThan(0n)
  })

  // The node charges a contract call 12x the base gas under the FATE ABI and
  // 30x under anything else, so `abi-version` has to actually reach the model
  // rather than merely appear in the signature. A caller who omits it gets the
  // 30x arm on purpose: too low is `too_low_fee` and a rejected transaction,
  // too high is accepted.
  it('prices a contract call by the abi-version it is given', () => {
    const size = 200
    const fate = fee.estimateGas('ContractCallTx', size, 1, 0, 3)
    const aevm = fee.estimateGas('ContractCallTx', size, 1, 0, 1)
    const unspecified = fee.estimateGas('ContractCallTx', size, 1, 0, undefined)
    const unrecognised = fee.estimateGas('ContractCallTx', size, 1, 0, 99)

    const sizeGas = BigInt(size) * 20n
    expect(fate).toBe(12n * 15000n + sizeGas)
    expect(aevm).toBe(30n * 15000n + sizeGas)
    // Not knowing the ABI costs the same as the dearest known one, never the
    // cheapest — and an ABI the node would not recognise is charged the same
    // way the node charges it.
    expect(unspecified).toBe(aevm)
    expect(unrecognised).toBe(aevm)

    // Every other tag the node keys on the ABI answers 5x on every arm, so
    // nothing else may move with it.
    for (const tag of ['ContractCreateTx', 'GaAttachTx', 'GaMetaTx']) {
      const flat = 5n * 15000n + sizeGas
      expect(fee.estimateGas(tag, size, 1, 0, 3)).toBe(flat)
      expect(fee.estimateGas(tag, size, 1, 0, undefined)).toBe(flat)
    }
  })

  it('derives AENS name id and minimum fee', () => {
    expect(aens.isName('example.chain')).toBe(true)
    const nameId = aens.produceNameId('example.chain')
    expect(nameId.startsWith('nm_')).toBe(true)
    const minFee = aens.minimumNameFee('example.chain')
    expect(BigInt(minFee)).toBeGreaterThan(0n)
  })
})

describe('scoped out on purpose', () => {
  it('rejects a Channel tag that needs an address list', () => {
    expect(() => tx.build('ChannelCreateTx', undefined, [])).toThrow()
  })
})
