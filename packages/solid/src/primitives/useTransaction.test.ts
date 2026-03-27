import { describe, expect, it } from 'vitest'
import { useTransaction } from './useTransaction'

describe('useTransaction', () => {
  it('should be a function', () => {
    expect(typeof useTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(useTransaction).toBeDefined()
  })
})
