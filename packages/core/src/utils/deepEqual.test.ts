import { describe, expect, it } from 'vitest'
import { deepEqual } from './deepEqual.js'

describe('deepEqual', () => {
  describe('primitives', () => {
    it('should compare equal numbers', () => {
      expect(deepEqual(1, 1)).toBe(true)
    })

    it('should compare unequal numbers', () => {
      expect(deepEqual(1, 2)).toBe(false)
    })

    it('should compare equal strings', () => {
      expect(deepEqual('a', 'a')).toBe(true)
    })

    it('should compare unequal strings', () => {
      expect(deepEqual('a', 'b')).toBe(false)
    })

    it('should compare booleans', () => {
      expect(deepEqual(true, true)).toBe(true)
      expect(deepEqual(true, false)).toBe(false)
    })

    it('should compare null', () => {
      expect(deepEqual(null, null)).toBe(true)
      expect(deepEqual(null, undefined)).toBe(false)
    })

    it('should compare undefined', () => {
      expect(deepEqual(undefined, undefined)).toBe(true)
    })

    it('should handle NaN', () => {
      expect(deepEqual(Number.NaN, Number.NaN)).toBe(true)
      expect(deepEqual(Number.NaN, 1)).toBe(false)
    })
  })

  describe('arrays', () => {
    it('should compare equal arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    it('should compare unequal arrays', () => {
      expect(deepEqual([1, 2], [1, 3])).toBe(false)
    })

    it('should compare arrays of different lengths', () => {
      expect(deepEqual([1], [1, 2])).toBe(false)
    })

    it('should compare empty arrays', () => {
      expect(deepEqual([], [])).toBe(true)
    })

    it('should compare nested arrays', () => {
      expect(deepEqual([[1, 2], [3]], [[1, 2], [3]])).toBe(true)
      expect(deepEqual([[1, 2], [3]], [[1, 2], [4]])).toBe(false)
    })
  })

  describe('objects', () => {
    it('should compare equal objects', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    })

    it('should compare unequal objects', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
    })

    it('should compare objects with different keys', () => {
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false)
    })

    it('should compare objects with different key counts', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    })

    it('should compare nested objects', () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true)
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
    })

    it('should compare empty objects', () => {
      expect(deepEqual({}, {})).toBe(true)
    })
  })

  describe('Maps', () => {
    it('should compare equal Maps', () => {
      const a = new Map([['key', 'value']])
      const b = new Map([['key', 'value']])
      expect(deepEqual(a, b)).toBe(true)
    })

    it('should compare unequal Maps', () => {
      const a = new Map([['key', 'value1']])
      const b = new Map([['key', 'value2']])
      expect(deepEqual(a, b)).toBe(false)
    })

    it('should compare Maps of different sizes', () => {
      const a = new Map([['a', 1]])
      const b = new Map<string, number>([
        ['a', 1],
        ['b', 2],
      ])
      expect(deepEqual(a, b)).toBe(false)
    })
  })

  describe('Sets', () => {
    it('should compare equal Sets', () => {
      expect(deepEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true)
    })

    it('should compare unequal Sets', () => {
      expect(deepEqual(new Set([1, 2]), new Set([1, 3]))).toBe(false)
    })

    it('should compare Sets of different sizes', () => {
      expect(deepEqual(new Set([1]), new Set([1, 2]))).toBe(false)
    })
  })

  describe('mixed types', () => {
    it('should return false for object vs array', () => {
      expect(deepEqual({}, [])).toBe(false)
    })

    it('should return false for different constructors', () => {
      expect(deepEqual(new Map(), new Set())).toBe(false)
    })

    it('should compare same reference', () => {
      const obj = { a: 1 }
      expect(deepEqual(obj, obj)).toBe(true)
    })
  })
})
