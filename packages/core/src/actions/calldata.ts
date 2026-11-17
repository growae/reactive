import { loadProtocol } from '../exports/protocol.js'

export type FateArgument =
  | boolean
  | string
  | bigint
  | number
  | { address: string }
  | { bytes: Uint8Array }
  | { stringBytes: Uint8Array }
  | { bits: bigint }
  | { tuple: readonly FateArgument[] }
  | { list: readonly FateArgument[] }
  | { map: readonly (readonly [FateArgument, FateArgument])[] }
  | {
      variant: {
        arities: readonly number[]
        index: number
        values: readonly FateArgument[]
      }
    }
  | { encoded: Uint8Array }

type Codec = Awaited<ReturnType<typeof loadProtocol>>['fate']
function encode(codec: Codec, value: FateArgument): Uint8Array {
  if (typeof value === 'number' && !Number.isSafeInteger(value))
    throw new RangeError('Use bigint for integers above the safe range')
  if (typeof value === 'number' || typeof value === 'bigint')
    return codec.encodeValue({ tag: 'integer', val: String(value) })
  if (typeof value === 'boolean')
    return codec.encodeValue({ tag: 'boolean', val: value })
  if (typeof value === 'string')
    return codec.encodeValue({
      tag: 'string-bytes',
      val: new TextEncoder().encode(value),
    })
  if ('address' in value)
    return codec.encodeValue({ tag: 'address', val: value.address })
  if ('bytes' in value)
    return codec.encodeValue({ tag: 'sized-bytes', val: value.bytes })
  if ('stringBytes' in value)
    return codec.encodeValue({ tag: 'string-bytes', val: value.stringBytes })
  if ('bits' in value)
    return codec.encodeValue({ tag: 'bits', val: String(value.bits) })
  if ('tuple' in value)
    return codec.encodeValue({
      tag: 'tuple-values',
      val: value.tuple.map((v) => encode(codec, v)),
    })
  if ('list' in value)
    return codec.encodeValue({
      tag: 'list-values',
      val: value.list.map((v) => encode(codec, v)),
    })
  if ('map' in value)
    return codec.encodeValue({
      tag: 'pairs',
      val: value.map.map(([k, v]) => [encode(codec, k), encode(codec, v)]),
    })
  if ('variant' in value) {
    const { arities, index, values } = value.variant
    if (
      arities.some((n) => !Number.isInteger(n) || n < 0 || n > 255) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > 255
    )
      throw new RangeError('Invalid FATE variant')
    return codec.encodeValue({
      tag: 'tagged',
      val: {
        arities: Uint8Array.from(arities),
        index,
        values: values.map((v) => encode(codec, v)),
      },
    })
  }
  return codec.encodeValue({ tag: 'raw', val: value.encoded })
}

export type ContractInvocation =
  | { callData: string; function?: never; args?: never }
  | { function: string; args?: readonly FateArgument[]; callData?: never }
export async function contractCalldata(invocation: ContractInvocation) {
  if (invocation.callData !== undefined) return invocation.callData
  const { fate } = await loadProtocol()
  return fate.encodeCalldata(
    invocation.function,
    (invocation.args ?? []).map((value) => encode(fate, value)),
  )
}

function decode(codec: Codec, input: Uint8Array): FateArgument {
  const value = codec.decodeValue(input)
  switch (value.tag) {
    case 'integer':
      return BigInt(value.val)
    case 'bits':
      return { bits: BigInt(value.val) }
    case 'boolean':
      return value.val
    case 'address':
      return { address: value.val }
    case 'string-bytes': {
      try {
        return new TextDecoder('utf-8', {
          fatal: true,
          ignoreBOM: true,
        }).decode(value.val)
      } catch {
        return { stringBytes: value.val }
      }
    }
    case 'sized-bytes':
      return { bytes: value.val }
    case 'tuple-values':
      return { tuple: value.val.map((v) => decode(codec, v)) }
    case 'list-values':
      return { list: value.val.map((v) => decode(codec, v)) }
    case 'pairs':
      return {
        map: value.val.map(([k, v]) => [decode(codec, k), decode(codec, v)]),
      }
    case 'tagged':
      return {
        variant: {
          arities: [...value.val.arities],
          index: value.val.index,
          values: value.val.values.map((v) => decode(codec, v)),
        },
      }
    case 'raw':
      return { encoded: value.val }
  }
}
export async function decodeContractValue(value: string) {
  const { encoding, fate } = await loadProtocol()
  const [prefix, bytes] = encoding.decodeAny(value)
  if (prefix !== 'cb') throw new Error('Expected a cb_ contract result')
  return decode(fate, bytes)
}
