import { describe, expect, it } from 'vitest'
import { useSignTypedData } from './useSignTypedData.js'

describe('useSignTypedData', () => {
  it('should be a function', () => {
    expect(typeof useSignTypedData).toBe('function')
  })

  it('should be exported', () => {
    expect(useSignTypedData).toBeDefined()
  })
})
