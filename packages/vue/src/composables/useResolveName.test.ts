import { describe, it, expect } from 'vitest'
import { useResolveName } from './useResolveName.js'

describe('useResolveName', () => {
  it('should be a function', () => {
    expect(typeof useResolveName).toBe('function')
  })

  it('should be exported', () => {
    expect(useResolveName).toBeDefined()
  })
})
