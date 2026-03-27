import { describe, it, expect } from 'vitest'
import { getConnections } from './getConnections.js'

describe('getConnections', () => {
  it('should be a function', () => {
    expect(typeof getConnections).toBe('function')
  })

  it('should return the connections map from state', () => {
    const connections = new Map([['uid_1', { account: 'ak_test' }]])
    const mockConfig = { state: { connections } }

    expect(getConnections(mockConfig as any)).toBe(connections)
  })

  it('should return empty map when no connections', () => {
    const connections = new Map()
    const mockConfig = { state: { connections } }

    expect(getConnections(mockConfig as any).size).toBe(0)
  })
})
