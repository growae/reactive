import { describe, expect, it } from 'vitest'
import { usePreclaimName } from './usePreclaimName'

describe('usePreclaimName', () => {
  it('should be a function', () => {
    expect(typeof usePreclaimName).toBe('function')
  })

  it('should be exported', () => {
    expect(usePreclaimName).toBeDefined()
  })
})
