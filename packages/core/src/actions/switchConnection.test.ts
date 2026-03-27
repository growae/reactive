import { describe, expect, it, vi } from 'vitest'
import { ConnectorNotFoundError } from '../errors/config.js'
import { switchConnection } from './switchConnection.js'

describe('switchConnection', () => {
  it('should be a function', () => {
    expect(typeof switchConnection).toBe('function')
  })

  it('should throw ConnectorNotFoundError when connector not in connections', () => {
    const mockConfig = {
      state: { connections: new Map() },
      setState: vi.fn(),
    }
    const connector = { uid: 'unknown' }

    expect(() =>
      switchConnection(mockConfig as any, { connector: connector as any }),
    ).toThrow(ConnectorNotFoundError)
  })

  it('should call setState when connector is found', () => {
    const connections = new Map([['uid_1', { account: 'ak_test' }]])
    const mockConfig = {
      state: { connections },
      setState: vi.fn(),
    }
    const connector = { uid: 'uid_1' }

    switchConnection(mockConfig as any, { connector: connector as any })

    expect(mockConfig.setState).toHaveBeenCalledWith(expect.any(Function))
  })
})
