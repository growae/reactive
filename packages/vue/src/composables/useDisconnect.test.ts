import { describe, it, expect } from 'vitest'
import { useDisconnect } from './useDisconnect.js'

describe('useDisconnect', () => {
  it('should be a function', () => {
    expect(typeof useDisconnect).toBe('function')
  })

  it('should be exported', () => {
    expect(useDisconnect).toBeDefined()
  })
})
