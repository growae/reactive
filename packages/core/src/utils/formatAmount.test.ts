import { describe, it, expect } from 'vitest'
import { toAe, toAettos, formatAmount } from './formatAmount.js'

describe('toAettos', () => {
  it('should convert whole AE to aettos', () => {
    expect(toAettos('1')).toBe(1000000000000000000n)
  })

  it('should convert decimal AE to aettos', () => {
    expect(toAettos('1.5')).toBe(1500000000000000000n)
  })

  it('should convert number input', () => {
    expect(toAettos(2)).toBe(2000000000000000000n)
  })

  it('should handle zero', () => {
    expect(toAettos('0')).toBe(0n)
  })

  it('should handle smallest unit', () => {
    expect(toAettos('0.000000000000000001')).toBe(1n)
  })

  it('should handle large amounts', () => {
    expect(toAettos('1000000')).toBe(1000000000000000000000000n)
  })
})

describe('toAe', () => {
  it('should convert aettos bigint to AE string', () => {
    expect(toAe(1000000000000000000n)).toBe('1')
  })

  it('should handle string input', () => {
    expect(toAe('1000000000000000000')).toBe('1')
  })

  it('should handle number input', () => {
    expect(toAe(1000000000000000000)).toBe('1')
  })

  it('should handle fractional aettos', () => {
    expect(toAe(1500000000000000000n)).toBe('1.5')
  })

  it('should handle zero', () => {
    expect(toAe(0n)).toBe('0')
  })

  it('should handle negative values', () => {
    expect(toAe(-1000000000000000000n)).toBe('-1')
  })

  it('should handle negative fractional values', () => {
    expect(toAe(-1500000000000000000n)).toBe('-1.5')
  })

  it('should handle very small amounts (1 aetto)', () => {
    expect(toAe(1n)).toBe('0.000000000000000001')
  })

  it('should strip trailing zeros from decimals', () => {
    expect(toAe(1100000000000000000n)).toBe('1.1')
  })
})

describe('formatAmount', () => {
  it('should format aettos to AE by default', () => {
    expect(formatAmount(1000000000000000000n)).toBe('1')
  })

  it('should format AE denomination as-is', () => {
    expect(formatAmount('1.5', { denomination: 'ae' })).toBe('1.5')
  })

  it('should apply decimal precision', () => {
    expect(formatAmount(1500000000000000000n, { decimals: 2 })).toBe('1.50')
  })

  it('should truncate to 0 decimals', () => {
    expect(formatAmount(1500000000000000000n, { decimals: 0 })).toBe('1')
  })

  it('should pad short decimal portions', () => {
    expect(formatAmount(1000000000000000000n, { decimals: 4 })).toBe('1.0000')
  })

  it('should handle zero', () => {
    expect(formatAmount(0n)).toBe('0')
  })

  it('should handle large numbers', () => {
    expect(formatAmount(1000000000000000000000000n)).toBe('1000000')
  })
})
