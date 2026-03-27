import { describe, expect, it } from 'vitest'
import { useWatchConnection } from './useWatchConnection'

describe('useWatchConnection', () => {
  it('should be a function', () => {
    expect(typeof useWatchConnection).toBe('function')
  })

  it('should be exported', () => {
    expect(useWatchConnection).toBeDefined()
  })
})
