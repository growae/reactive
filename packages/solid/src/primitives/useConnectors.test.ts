import { describe, expect, it } from 'vitest'
import { useConnectors } from './useConnectors'

describe('useConnectors', () => {
  it('should be a function', () => {
    expect(typeof useConnectors).toBe('function')
  })

  it('should be exported', () => {
    expect(useConnectors).toBeDefined()
  })
})
