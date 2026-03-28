import { describe, expect, it } from 'vitest'
import { useBuildTransaction } from './useBuildTransaction'

describe('useBuildTransaction', () => {
  it('should be a function', () => {
    expect(typeof useBuildTransaction).toBe('function')
  })

  it('should be exported', () => {
    expect(useBuildTransaction).toBeDefined()
  })
})
