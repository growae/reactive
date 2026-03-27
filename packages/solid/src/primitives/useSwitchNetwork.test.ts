import { describe, it, expect } from 'vitest'
import { useSwitchNetwork } from './useSwitchNetwork.js'

describe('useSwitchNetwork', () => {
  it('should be a function', () => {
    expect(typeof useSwitchNetwork).toBe('function')
  })

  it('should be exported', () => {
    expect(useSwitchNetwork).toBeDefined()
  })
})
