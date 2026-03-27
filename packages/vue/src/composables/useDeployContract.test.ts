import { describe, expect, it } from 'vitest'
import { useDeployContract } from './useDeployContract.js'

describe('useDeployContract', () => {
  it('should be a function', () => {
    expect(typeof useDeployContract).toBe('function')
  })

  it('should be exported', () => {
    expect(useDeployContract).toBeDefined()
  })
})
