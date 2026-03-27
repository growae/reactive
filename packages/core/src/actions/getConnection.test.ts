import { describe, it, expect } from 'vitest'
import { getConnection } from './getConnection.js'

describe('getConnection', () => {
  it('should be a function', () => {
    expect(typeof getConnection).toBe('function')
  })

  it('should return undefined when no current connection', () => {
    const mockConfig = {
      state: { connections: new Map(), current: null },
    }
    expect(getConnection(mockConfig as any)).toBeUndefined()
  })

  it('should return the current connection', () => {
    const connection = { account: 'ak_test' }
    const connections = new Map([['uid_1', connection]])
    const mockConfig = {
      state: { connections, current: 'uid_1' },
    }
    expect(getConnection(mockConfig as any)).toBe(connection)
  })

  it('should return undefined when current key not in connections map', () => {
    const mockConfig = {
      state: { connections: new Map(), current: 'nonexistent' },
    }
    expect(getConnection(mockConfig as any)).toBeUndefined()
  })
})
