import { describe, expect, it } from 'vitest'
import { useNodeClient } from './useNodeClient'

describe('useNodeClient', () => {
  it('should be a function', () => {
    expect(typeof useNodeClient).toBe('function')
  })

  it('should be exported', () => {
    expect(useNodeClient).toBeDefined()
  })
})
