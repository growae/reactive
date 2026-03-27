import { describe, expect, it } from 'vitest'
import { useOracleState } from './useOracleState'

describe('useOracleState', () => {
  it('should be a function', () => {
    expect(typeof useOracleState).toBe('function')
  })

  it('should be exported', () => {
    expect(useOracleState).toBeDefined()
  })
})
