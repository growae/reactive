import { describe, expect, it } from 'vitest'

import { satisfiesEngineRange } from './utils'

describe('satisfiesEngineRange', () => {
  it('accepts a version above a >= floor', () => {
    expect(satisfiesEngineRange('11.19.0', '>=11')).toBe(true)
    expect(satisfiesEngineRange('12.0.0', '>=11')).toBe(true)
  })

  it('rejects a version below a >= floor', () => {
    expect(satisfiesEngineRange('10.9.8', '>=11')).toBe(false)
  })

  it('treats a bare major as major.0.0 for comparison', () => {
    expect(satisfiesEngineRange('11.0.0', '>=11')).toBe(true)
    expect(satisfiesEngineRange('10.99.99', '>=11')).toBe(false)
  })

  it('supports other comparators', () => {
    expect(satisfiesEngineRange('9.0.0', '<11')).toBe(true)
    expect(satisfiesEngineRange('11.0.0', '<11')).toBe(false)
    expect(satisfiesEngineRange('11.0.0', '<=11')).toBe(true)
    expect(satisfiesEngineRange('11.0.1', '<=11')).toBe(false)
  })

  it('ANDs space-separated comparators', () => {
    expect(satisfiesEngineRange('14.0.0', '>=11 <15')).toBe(true)
    expect(satisfiesEngineRange('15.0.0', '>=11 <15')).toBe(false)
  })
})
