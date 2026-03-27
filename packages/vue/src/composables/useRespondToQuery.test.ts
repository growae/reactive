import { describe, expect, it } from 'vitest'
import { useRespondToQuery } from './useRespondToQuery.js'

describe('useRespondToQuery', () => {
  it('should be a function', () => {
    expect(typeof useRespondToQuery).toBe('function')
  })

  it('should be exported', () => {
    expect(useRespondToQuery).toBeDefined()
  })
})
