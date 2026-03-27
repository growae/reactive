import { describe, expect, it } from 'vitest'
import { useSimulateContract } from './useSimulateContract'

describe('useSimulateContract', () => {
  it('should be a function', () => {
    expect(typeof useSimulateContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useSimulateContract).toBeDefined()
  })
})
