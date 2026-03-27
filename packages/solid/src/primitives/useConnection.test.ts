import { describe, expect, it } from 'vitest'
import { useConnection } from './useConnection'

describe('useConnection', () => {
  it('should be a function', () => {
    expect(typeof useConnection).toBe('function')
  })

  it('should be exported', () => {
    expect(useConnection).toBeDefined()
  })
})
