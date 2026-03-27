import { describe, it, expect } from 'vitest'
import { useSignMessage } from './useSignMessage.js'

describe('useSignMessage', () => {
  it('should be a function', () => {
    expect(typeof useSignMessage).toBe('function')
  })

  it('should be exported', () => {
    expect(useSignMessage).toBeDefined()
  })
})
