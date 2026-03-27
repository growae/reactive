import { describe, expect, it } from 'vitest'
import { useCloseChannel } from './useCloseChannel'

describe('useCloseChannel', () => {
  it('should be a function', () => {
    expect(typeof useCloseChannel).toBe('function')
  })

  it('should be exported', () => {
    expect(useCloseChannel).toBeDefined()
  })
})
