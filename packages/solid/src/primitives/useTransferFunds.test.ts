import { describe, expect, it } from 'vitest'
import { useTransferFunds } from './useTransferFunds'

describe('useTransferFunds', () => {
  it('should be a function', () => {
    expect(typeof useTransferFunds).toBe('function')
  })

  it('should be exported', () => {
    expect(useTransferFunds).toBeDefined()
  })
})
