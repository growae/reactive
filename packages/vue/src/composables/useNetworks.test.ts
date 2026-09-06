import { describe, expect, it } from 'vitest'
import { useNetworks } from './useNetworks.js'

describe('useNetworks', () => {
  it('should be a function', () => {
    expect(typeof useNetworks).toBe('function')
  })

  it('should be exported', () => {
    expect(useNetworks).toBeDefined()
  })
})
