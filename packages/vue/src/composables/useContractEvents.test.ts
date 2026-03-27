import { describe, expect, it } from 'vitest'
import { useContractEvents } from './useContractEvents'

describe('useContractEvents', () => {
  it('should be a function', () => {
    expect(typeof useContractEvents).toBe('function')
  })

  it('should be exported', () => {
    expect(useContractEvents).toBeDefined()
  })
})
