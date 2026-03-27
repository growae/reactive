import { describe, expect, it, vi } from 'vitest'
import { watchConnection } from './watchConnection.js'

describe('watchConnection', () => {
  it('should be a function', () => {
    expect(typeof watchConnection).toBe('function')
  })

  it('should call config.subscribe and return unsubscribe function', () => {
    const unsubscribe = vi.fn()
    const mockConfig = {
      subscribe: vi.fn().mockReturnValue(unsubscribe),
    }
    const onChange = vi.fn()

    const result = watchConnection(mockConfig as any, { onChange })

    expect(mockConfig.subscribe).toHaveBeenCalledWith(
      expect.any(Function),
      onChange,
    )
    expect(result).toBe(unsubscribe)
  })

  it('should select current from state', () => {
    const mockConfig = {
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    }

    watchConnection(mockConfig as any, { onChange: vi.fn() })

    const selector = mockConfig.subscribe.mock.calls[0]![0]
    expect(selector({ current: 'conn_1' })).toBe('conn_1')
    expect(selector({ current: null })).toBeNull()
  })
})
