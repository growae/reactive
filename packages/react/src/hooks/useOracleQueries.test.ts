import { describe, it, expect } from 'vitest'
import { useOracleQueries } from './useOracleQueries.js'

describe('useOracleQueries', () => {
  it('should be a function', () => {
    expect(typeof useOracleQueries).toBe('function')
  })

  it('should be exported', () => {
    expect(useOracleQueries).toBeDefined()
  })
})
