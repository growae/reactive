import { describe, it, expect } from 'vitest'
import { useCloseChannel } from './useCloseChannel.js'

describe('useCloseChannel', () => {
  it('should be a function', () => {
    expect(typeof useCloseChannel).toBe('function')
  })

  it('should be exported', () => {
    expect(useCloseChannel).toBeDefined()
  })
})
