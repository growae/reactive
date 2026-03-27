import { describe, it, expect } from 'vitest'
import { useReconnect } from './useReconnect.js'

describe('useReconnect', () => {
  it('should be a function', () => {
    expect(typeof useReconnect).toBe('function')
  })

  it('should be exported', () => {
    expect(useReconnect).toBeDefined()
  })
})
