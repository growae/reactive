import { describe, it, expect } from 'vitest'
import { useConnectorClient } from './useConnectorClient.js'

describe('useConnectorClient', () => {
  it('should be a function', () => {
    expect(typeof useConnectorClient).toBe('function')
  })

  it('should be exported', () => {
    expect(useConnectorClient).toBeDefined()
  })
})
