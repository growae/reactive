import { describe, expect, it } from 'vitest'
import { useCompileContract } from './useCompileContract'

describe('useCompileContract', () => {
  it('should be a function', () => {
    expect(typeof useCompileContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useCompileContract).toBeDefined()
  })
})
