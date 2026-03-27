import { describe, expect, it } from 'vitest'
import { useReadContracts } from './useReadContracts'

describe('useReadContracts', () => {
  it('should be a function', () => {
    expect(typeof useReadContracts).toBe('function')
  })

  it('should be exported', () => {
    expect(useReadContracts).toBeDefined()
  })
})
