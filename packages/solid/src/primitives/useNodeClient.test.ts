import { describe, it, expect } from 'vitest'
import { useNodeClient } from './useNodeClient.js'

describe('useNodeClient', () => {
  it('should be a function', () => {
    expect(typeof useNodeClient).toBe('function')
  })

  it('should be exported', () => {
    expect(useNodeClient).toBeDefined()
  })
})
