import { describe, expect, it } from 'vitest'
import { useAccount } from './useAccount'

describe('useAccount', () => {
  it('should be a function', () => {
    expect(typeof useAccount).toBe('function')
  })

  it('should be exported', () => {
    expect(useAccount).toBeDefined()
  })
})
