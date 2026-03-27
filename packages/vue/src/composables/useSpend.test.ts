import { describe, it, expect } from 'vitest'
import { useSpend } from './useSpend.js'

describe('useSpend', () => {
  it('should be a function', () => {
    expect(typeof useSpend).toBe('function')
  })

  it('should be exported', () => {
    expect(useSpend).toBeDefined()
  })
})
