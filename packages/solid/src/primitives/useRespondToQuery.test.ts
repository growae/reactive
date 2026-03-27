import { describe, it, expect } from 'vitest'
import { useRespondToQuery } from './useRespondToQuery.js'

describe('useRespondToQuery', () => {
  it('should be a function', () => {
    expect(typeof useRespondToQuery).toBe('function')
  })

  it('should be exported', () => {
    expect(useRespondToQuery).toBeDefined()
  })
})
