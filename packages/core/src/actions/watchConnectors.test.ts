import { describe, expect, it, vi } from 'vitest'
import { watchConnectors } from './watchConnectors.js'

describe('watchConnectors', () => {
  it('should be a function', () => {
    expect(typeof watchConnectors).toBe('function')
  })

  it('should call config.subscribe and return unsubscribe function', () => {
    const unsubscribe = vi.fn()
    const mockConfig = {
      subscribe: vi.fn().mockReturnValue(unsubscribe),
    }
    const onChange = vi.fn()

    const result = watchConnectors(mockConfig as any, { onChange })

    expect(mockConfig.subscribe).toHaveBeenCalledWith(
      expect.any(Function),
      onChange,
    )
    expect(typeof result).toBe('function')
    expect(result).toBe(unsubscribe)
  })

  it('should select connectors from state', () => {
    const mockConfig = {
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    }
    const onChange = vi.fn()

    watchConnectors(mockConfig as any, { onChange })

    const selector = mockConfig.subscribe.mock.calls[0][0]
    expect(selector({ connectors: ['a', 'b'] })).toEqual(['a', 'b'])
    expect(selector({})).toEqual([])
  })
})
