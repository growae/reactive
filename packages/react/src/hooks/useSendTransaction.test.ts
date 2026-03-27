import { describe, expect, it } from 'vitest'
import { useSendTransaction } from './useSendTransaction'

describe('useSendTransaction', () => {
  it('should be a function', () => {
    expect(typeof useSendTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(useSendTransaction).toBeDefined()
  })
})
