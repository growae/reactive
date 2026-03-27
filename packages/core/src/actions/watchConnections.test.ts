import { describe, expect, it, vi } from 'vitest'
import { watchConnections } from './watchConnections'

describe('watchConnections', () => {
  it('should be a function', () => {
    expect(typeof watchConnections).toBe('function')
  })

  it('should call config.subscribe and return unsubscribe function', () => {
    const unsubscribe = vi.fn()
    const mockConfig = {
      subscribe: vi.fn().mockReturnValue(unsubscribe),
    }
    const onChange = vi.fn()

    const result = watchConnections(mockConfig as any, { onChange })

    expect(mockConfig.subscribe).toHaveBeenCalledWith(
      expect.any(Function),
      onChange,
    )
    expect(result).toBe(unsubscribe)
  })

  it('should select connections from state', () => {
    const mockConfig = {
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    }

    watchConnections(mockConfig as any, { onChange: vi.fn() })

    const selector = mockConfig.subscribe.mock.calls[0]![0]
    const connections = new Map([['c1', {} as any]])
    expect(selector({ connections })).toBe(connections)
    expect(selector({} as any)).toBeUndefined()
  })
})
