import { describe, it, expect } from 'vitest'
import { useVerifyTypedData } from './useVerifyTypedData.js'

describe('useVerifyTypedData', () => {
  it('should be a function', () => {
    expect(typeof useVerifyTypedData).toBe('function')
  })

  it('should be exported', () => {
    expect(useVerifyTypedData).toBeDefined()
  })
})
