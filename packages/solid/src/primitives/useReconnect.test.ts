import { describe, expect, it } from 'vitest'
import { useReconnect } from './useReconnect'

describe('useReconnect', () => {
  it('should be a function', () => {
    expect(typeof useReconnect).toBe('function')
  })

  it('should be exported', () => {
    expect(useReconnect).toBeDefined()
  })
})
