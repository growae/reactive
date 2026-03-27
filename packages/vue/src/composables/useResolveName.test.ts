import { describe, expect, it } from 'vitest'
import { useResolveName } from './useResolveName'

describe('useResolveName', () => {
  it('should be a function', () => {
    expect(typeof useResolveName).toBe('function')
  })

  it('should be exported', () => {
    expect(useResolveName).toBeDefined()
  })
})
