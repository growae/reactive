import { describe, expect, it } from 'vitest'
import { useVerifyMessage } from './useVerifyMessage'

describe('useVerifyMessage', () => {
  it('should be a function', () => {
    expect(typeof useVerifyMessage).toBe('function')
  })

  it('should be exported', () => {
    expect(useVerifyMessage).toBeDefined()
  })
})
