import { describe, expect, it, vi } from 'vitest'
import { watchConnectors } from './watchConnectors.js'

describe('watchConnectors', () => {
  it('should be a function', () => {
    expect(typeof watchConnectors).toBe('function')
  })

  it('should call connectors.subscribe and return unsubscribe function', () => {
    const unsubscribe = vi.fn()
    const subscribe = vi.fn().mockReturnValue(unsubscribe)
    const mockConfig = {
      _internal: { connectors: { subscribe } },
    }
    const onChange = vi.fn()

    const result = watchConnectors(mockConfig as any, { onChange })

    expect(subscribe).toHaveBeenCalledWith(onChange)
    expect(typeof result).toBe('function')
    expect(result).toBe(unsubscribe)
  })

  it('does not use a state selector; forwards listener to connectors store', () => {
    const subscribe = vi.fn().mockReturnValue(vi.fn())
    const mockConfig = {
      _internal: { connectors: { subscribe } },
    }
    const onChange = vi.fn()

    watchConnectors(mockConfig as any, { onChange })

    expect(subscribe).toHaveBeenCalledWith(onChange)
    expect(subscribe.mock.calls[0]).toEqual([onChange])
  })
})
