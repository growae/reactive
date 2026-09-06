import { describe, expect, it } from 'vitest'
import { useHeight } from './useHeight.js'

describe('useHeight', () => {
  it('should be a function', () => {
    expect(typeof useHeight).toBe('function')
  })

  it('should be exported', () => {
    expect(useHeight).toBeDefined()
  })
})
