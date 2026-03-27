import { describe, expect, it } from 'vitest'
import { useEstimateGas } from './useEstimateGas'

describe('useEstimateGas', () => {
  it('should be a function', () => {
    expect(typeof useEstimateGas).toBe('function')
  })

  it('should be exported', () => {
    expect(useEstimateGas).toBeDefined()
  })
})
