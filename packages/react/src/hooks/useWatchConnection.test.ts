import { describe, it, expect } from 'vitest'
import { useWatchConnection } from './useWatchConnection.js'

describe('useWatchConnection', () => {
  it('should be a function', () => {
    expect(typeof useWatchConnection).toBe('function')
  })

  it('should be exported', () => {
    expect(useWatchConnection).toBeDefined()
  })
})
