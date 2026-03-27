import { describe, expect, it } from 'vitest'
import { useWatchConnectors } from './useWatchConnectors'

describe('useWatchConnectors', () => {
  it('should be a function', () => {
    expect(typeof useWatchConnectors).toBe('function')
  })

  it('should be exported', () => {
    expect(useWatchConnectors).toBeDefined()
  })
})
