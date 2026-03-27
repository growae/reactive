import { describe, it, expect } from 'vitest'
import { useRevokeName } from './useRevokeName.js'

describe('useRevokeName', () => {
  it('should be a function', () => {
    expect(typeof useRevokeName).toBe('function')
  })

  it('should be exported', () => {
    expect(useRevokeName).toBeDefined()
  })
})
