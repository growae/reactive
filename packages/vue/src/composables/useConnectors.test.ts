import { describe, it, expect } from 'vitest'
import { useConnectors } from './useConnectors.js'

describe('useConnectors', () => {
  it('should be a function', () => {
    expect(typeof useConnectors).toBe('function')
  })

  it('should be exported', () => {
    expect(useConnectors).toBeDefined()
  })
})
