import { describe, it, expect } from 'vitest'
import { getConnectors } from './getConnectors.js'

describe('getConnectors', () => {
  it('should be a function', () => {
    expect(typeof getConnectors).toBe('function')
  })

  it('should return connectors from config', () => {
    const connectors = [{ uid: '1', name: 'mock' }]
    const mockConfig = { connectors }

    expect(getConnectors(mockConfig as any)).toBe(connectors)
  })

  it('should return empty array when no connectors', () => {
    const mockConfig = { connectors: [] }
    expect(getConnectors(mockConfig as any)).toEqual([])
  })
})
