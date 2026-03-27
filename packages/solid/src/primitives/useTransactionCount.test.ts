import { describe, expect, it } from 'vitest'
import { useTransactionCount } from './useTransactionCount'

describe('useTransactionCount', () => {
  it('should be a function', () => {
    expect(typeof useTransactionCount).toBe('function')
  })

  it('should be exported', () => {
    expect(useTransactionCount).toBeDefined()
  })
})
