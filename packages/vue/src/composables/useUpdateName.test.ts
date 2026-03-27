import { describe, expect, it } from 'vitest'
import { useUpdateName } from './useUpdateName.js'

describe('useUpdateName', () => {
  it('should be a function', () => {
    expect(typeof useUpdateName).toBe('function')
  })

  it('should be exported', () => {
    expect(useUpdateName).toBeDefined()
  })
})
