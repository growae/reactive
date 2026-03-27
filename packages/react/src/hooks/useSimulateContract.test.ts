import { describe, it, expect } from 'vitest'
import { useSimulateContract } from './useSimulateContract.js'

describe('useSimulateContract', () => {
  it('should be a function', () => {
    expect(typeof useSimulateContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useSimulateContract).toBeDefined()
  })
})
