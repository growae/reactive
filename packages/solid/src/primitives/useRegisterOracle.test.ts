import { describe, expect, it } from 'vitest'
import { useRegisterOracle } from './useRegisterOracle'

describe('useRegisterOracle', () => {
  it('should be a function', () => {
    expect(typeof useRegisterOracle).toBe('function')
  })

  it('should be exported', () => {
    expect(useRegisterOracle).toBeDefined()
  })
})
