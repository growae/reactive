import { describe, it, expect } from 'vitest'
import { useConnection } from './useConnection.js'

describe('useConnection', () => {
  it('should be a function', () => {
    expect(typeof useConnection).toBe('function')
  })

  it('should be exported', () => {
    expect(useConnection).toBeDefined()
  })
})
