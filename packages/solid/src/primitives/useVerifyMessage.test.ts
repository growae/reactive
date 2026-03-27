import { describe, it, expect } from 'vitest'
import { useVerifyMessage } from './useVerifyMessage.js'

describe('useVerifyMessage', () => {
  it('should be a function', () => {
    expect(typeof useVerifyMessage).toBe('function')
  })

  it('should be exported', () => {
    expect(useVerifyMessage).toBeDefined()
  })
})
