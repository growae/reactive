import { describe, it, expect } from 'vitest'
import { useSignTransaction } from './useSignTransaction.js'

describe('useSignTransaction', () => {
  it('should be a function', () => {
    expect(typeof useSignTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(useSignTransaction).toBeDefined()
  })
})
