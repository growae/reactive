import { describe, expect, it } from 'vitest'
import { useClaimName } from './useClaimName.js'

describe('useClaimName', () => {
  it('should be a function', () => {
    expect(typeof useClaimName).toBe('function')
  })

  it('should be exported', () => {
    expect(useClaimName).toBeDefined()
  })
})
