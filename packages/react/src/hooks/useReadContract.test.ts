import { describe, expect, it } from 'vitest'
import { useReadContract } from './useReadContract.js'

describe('useReadContract', () => {
  it('should be a function', () => {
    expect(typeof useReadContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useReadContract).toBeDefined()
  })
})
