import { describe, expect, it } from 'vitest'
import { deserialize } from './deserialize.js'
import { serialize } from './serialize.js'

describe('serialize', () => {
  it('should serialize plain objects', () => {
    const result = serialize({ a: 1, b: 'hello' })
    expect(JSON.parse(result)).toEqual({ a: 1, b: 'hello' })
  })

  it('should serialize BigInt values', () => {
    const result = serialize({ value: 123n })
    const parsed = JSON.parse(result)
    expect(parsed.value).toEqual({ __type: 'bigint', value: '123' })
  })

  it('should serialize Map values', () => {
    const map = new Map([['key', 'val']])
    const result = serialize({ data: map })
    const parsed = JSON.parse(result)
    expect(parsed.data).toEqual({ __type: 'Map', value: [['key', 'val']] })
  })

  it('should serialize null values', () => {
    const result = serialize({ a: null })
    expect(JSON.parse(result)).toEqual({ a: null })
  })

  it('should handle nested structures', () => {
    const result = serialize({ nested: { value: 42n } })
    const parsed = JSON.parse(result)
    expect(parsed.nested.value).toEqual({ __type: 'bigint', value: '42' })
  })
})

describe('deserialize', () => {
  it('should deserialize plain objects', () => {
    const result = deserialize<{ a: number }>('{"a":1}')
    expect(result).toEqual({ a: 1 })
  })

  it('should deserialize BigInt values', () => {
    const result = deserialize<{ value: bigint }>(
      '{"value":{"__type":"bigint","value":"123"}}',
    )
    expect(result.value).toBe(123n)
  })

  it('should deserialize Map values', () => {
    const result = deserialize<{ data: Map<string, string> }>(
      '{"data":{"__type":"Map","value":[["key","val"]]}}',
    )
    expect(result.data).toBeInstanceOf(Map)
    expect(result.data.get('key')).toBe('val')
  })
})

describe('serialize/deserialize roundtrip', () => {
  it('should roundtrip BigInt', () => {
    const original = { balance: 1000000000000000000n }
    const result = deserialize<typeof original>(serialize(original))
    expect(result.balance).toBe(original.balance)
  })

  it('should roundtrip Map', () => {
    const original = {
      connections: new Map<string, number>([
        ['a', 1],
        ['b', 2],
      ]),
    }
    const result = deserialize<typeof original>(serialize(original))
    expect(result.connections).toBeInstanceOf(Map)
    expect(result.connections.get('a')).toBe(1)
    expect(result.connections.get('b')).toBe(2)
  })

  it('should roundtrip nested structures', () => {
    const original = {
      data: {
        amount: 500n,
        entries: new Map([['key', 'value']]),
      },
    }
    const result = deserialize<typeof original>(serialize(original))
    expect(result.data.amount).toBe(500n)
    expect(result.data.entries.get('key')).toBe('value')
  })
})
