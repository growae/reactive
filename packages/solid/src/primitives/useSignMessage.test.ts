import { describe, expect, it } from 'vitest'
import { useSignMessage } from './useSignMessage.js'

describe('useSignMessage', () => {
  it('should be a function', () => {
    expect(typeof useSignMessage).toBe('function')
  })

  it('should be exported', () => {
    expect(useSignMessage).toBeDefined()
  })
})
