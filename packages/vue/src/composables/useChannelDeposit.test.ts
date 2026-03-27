import { describe, expect, it } from 'vitest'
import { useChannelDeposit } from './useChannelDeposit.js'

describe('useChannelDeposit', () => {
  it('should be a function', () => {
    expect(typeof useChannelDeposit).toBe('function')
  })

  it('should be exported', () => {
    expect(useChannelDeposit).toBeDefined()
  })
})
