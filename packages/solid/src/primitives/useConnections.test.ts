import { describe, expect, it } from 'vitest'
import { useConnections } from './useConnections.js'

describe('useConnections', () => {
  it('should be a function', () => {
    expect(typeof useConnections).toBe('function')
  })

  it('should be exported', () => {
    expect(useConnections).toBeDefined()
  })
})
