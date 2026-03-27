import { describe, expect, it } from 'vitest'
import { useOpenChannel } from './useOpenChannel'

describe('useOpenChannel', () => {
  it('should be a function', () => {
    expect(typeof useOpenChannel).toBe('function')
  })

  it('should be exported', () => {
    expect(useOpenChannel).toBeDefined()
  })
})
