import { describe, it, expect } from 'vitest'
import { useBlock } from './useBlock.js'

describe('useBlock', () => {
  it('should be a function', () => {
    expect(typeof useBlock).toBe('function')
  })

  it('should be exported', () => {
    expect(useBlock).toBeDefined()
  })
})
