import { describe, it, expect } from 'vitest'
import { useWatchConnectors } from './useWatchConnectors.js'

describe('useWatchConnectors', () => {
  it('should be a function', () => {
    expect(typeof useWatchConnectors).toBe('function')
  })

  it('should be exported', () => {
    expect(useWatchConnectors).toBeDefined()
  })
})
