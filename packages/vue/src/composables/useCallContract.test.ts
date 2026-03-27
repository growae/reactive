import { describe, it, expect } from 'vitest'
import { useCallContract } from './useCallContract.js'

describe('useCallContract', () => {
  it('should be a function', () => {
    expect(typeof useCallContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useCallContract).toBeDefined()
  })
})
