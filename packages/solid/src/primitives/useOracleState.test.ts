import { describe, it, expect } from 'vitest'
import { useOracleState } from './useOracleState.js'

describe('useOracleState', () => {
  it('should be a function', () => {
    expect(typeof useOracleState).toBe('function')
  })

  it('should be exported', () => {
    expect(useOracleState).toBeDefined()
  })
})
