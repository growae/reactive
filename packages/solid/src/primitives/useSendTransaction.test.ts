import { describe, it, expect } from 'vitest'
import { useSendTransaction } from './useSendTransaction.js'

describe('useSendTransaction', () => {
  it('should be a function', () => {
    expect(typeof useSendTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(useSendTransaction).toBeDefined()
  })
})
