import { describe, it, expect } from 'vitest'
import { useTransferName } from './useTransferName.js'

describe('useTransferName', () => {
  it('should be a function', () => {
    expect(typeof useTransferName).toBe('function')
  })

  it('should be exported', () => {
    expect(useTransferName).toBeDefined()
  })
})
