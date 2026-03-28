import { describe, expect, it } from 'vitest'
import { useSignDelegation } from './useSignDelegation'

describe('useSignDelegation', () => {
  it('should be a function', () => {
    expect(typeof useSignDelegation).toBe('function')
  })

  it('should be exported', () => {
    expect(useSignDelegation).toBeDefined()
  })
})
