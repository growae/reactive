import { describe, expect, it } from 'vitest'
import { useWatchHeight } from './useWatchHeight.js'

describe('useWatchHeight', () => {
  it('should be a function', () => {
    expect(typeof useWatchHeight).toBe('function')
  })

  it('should be exported', () => {
    expect(useWatchHeight).toBeDefined()
  })
})
