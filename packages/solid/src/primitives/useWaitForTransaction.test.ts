import { describe, expect, it } from 'vitest'
import { useWaitForTransaction } from './useWaitForTransaction.js'

describe('useWaitForTransaction', () => {
  it('should be a function', () => {
    expect(typeof useWaitForTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(useWaitForTransaction).toBeDefined()
  })
})
