import { describe, it, expect } from 'vitest'
import { useContractEvents } from './useContractEvents.js'

describe('useContractEvents', () => {
  it('should be a function', () => {
    expect(typeof useContractEvents).toBe('function')
  })

  it('should be exported', () => {
    expect(useContractEvents).toBeDefined()
  })
})
