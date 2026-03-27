import { describe, it, expect } from 'vitest'
import { useQueryOracle } from './useQueryOracle.js'

describe('useQueryOracle', () => {
  it('should be a function', () => {
    expect(typeof useQueryOracle).toBe('function')
  })

  it('should be exported', () => {
    expect(useQueryOracle).toBeDefined()
  })
})
