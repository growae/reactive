import { describe, expect, it } from 'vitest'
import { useContractBytecode } from './useContractBytecode'

describe('useContractBytecode', () => {
  it('should be a function', () => {
    expect(typeof useContractBytecode).toBe('function')
  })

  it('should be exported', () => {
    expect(useContractBytecode).toBeDefined()
  })
})
