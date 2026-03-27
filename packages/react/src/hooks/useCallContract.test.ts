import { describe, expect, it } from 'vitest'
import { useCallContract } from './useCallContract'

describe('useCallContract', () => {
  it('should be a function', () => {
    expect(typeof useCallContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useCallContract).toBeDefined()
  })
})
