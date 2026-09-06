import { describe, expect, it } from 'vitest'
import { usePayForTransaction } from './usePayForTransaction.js'

describe('usePayForTransaction', () => {
  it('should be a function', () => {
    expect(typeof usePayForTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(usePayForTransaction).toBeDefined()
  })
})
