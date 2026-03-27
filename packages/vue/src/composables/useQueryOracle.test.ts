import { describe, expect, it } from 'vitest'
import { useQueryOracle } from './useQueryOracle'

describe('useQueryOracle', () => {
  it('should be a function', () => {
    expect(typeof useQueryOracle).toBe('function')
  })

  it('should be exported', () => {
    expect(useQueryOracle).toBeDefined()
  })
})
