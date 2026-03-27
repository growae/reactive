import { describe, it, expect } from 'vitest'
import {
  isValidAddress,
  isValidContractAddress,
  isValidTxHash,
  isValidName,
} from './encoding.js'

describe('isValidAddress', () => {
  it('should return true for valid ak_ address', () => {
    expect(
      isValidAddress('ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM'),
    ).toBe(true)
  })

  it('should return false for empty string', () => {
    expect(isValidAddress('')).toBe(false)
  })

  it('should return false for ct_ prefix', () => {
    expect(
      isValidAddress(
        'ct_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
      ),
    ).toBe(false)
  })

  it('should return false for missing prefix', () => {
    expect(
      isValidAddress('2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM'),
    ).toBe(false)
  })

  it('should return false for just the prefix', () => {
    expect(isValidAddress('ak_')).toBe(false)
  })
})

describe('isValidContractAddress', () => {
  it('should return true for valid ct_ address', () => {
    expect(
      isValidContractAddress(
        'ct_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
      ),
    ).toBe(true)
  })

  it('should return false for ak_ address', () => {
    expect(
      isValidContractAddress(
        'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
      ),
    ).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidContractAddress('')).toBe(false)
  })
})

describe('isValidTxHash', () => {
  it('should return true for valid th_ hash', () => {
    expect(
      isValidTxHash(
        'th_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
      ),
    ).toBe(true)
  })

  it('should return false for ak_ address', () => {
    expect(
      isValidTxHash(
        'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
      ),
    ).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidTxHash('')).toBe(false)
  })
})

describe('isValidName', () => {
  it('should return true for .chain name', () => {
    expect(isValidName('test.chain')).toBe(true)
  })

  it('should return false for .eth name', () => {
    expect(isValidName('test.eth')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidName('')).toBe(false)
  })

  it('should return true for complex .chain name', () => {
    expect(isValidName('my-long-name.chain')).toBe(true)
  })
})
