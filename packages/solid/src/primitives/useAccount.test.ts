import { describe, it, expect } from 'vitest'
import { useAccount } from './useAccount.js'

describe('useAccount', () => {
  it('should be a function', () => {
    expect(typeof useAccount).toBe('function')
  })

  it('should be exported', () => {
    expect(useAccount).toBeDefined()
  })
})
