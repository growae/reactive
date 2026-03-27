import { describe, expect, it } from 'vitest'
import { useTransferName } from './useTransferName'

describe('useTransferName', () => {
  it('should be a function', () => {
    expect(typeof useTransferName).toBe('function')
  })

  it('should be exported', () => {
    expect(useTransferName).toBeDefined()
  })
})
