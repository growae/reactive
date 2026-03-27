import { describe, it, expect } from 'vitest'
import { useContractBytecode } from './useContractBytecode.js'

describe('useContractBytecode', () => {
  it('should be a function', () => {
    expect(typeof useContractBytecode).toBe('function')
  })

  it('should be exported', () => {
    expect(useContractBytecode).toBeDefined()
  })
})
