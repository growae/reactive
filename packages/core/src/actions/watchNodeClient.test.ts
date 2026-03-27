import { describe, expect, it, vi } from 'vitest'
import { watchNodeClient } from './watchNodeClient.js'

describe('watchNodeClient', () => {
  it('should be a function', () => {
    expect(typeof watchNodeClient).toBe('function')
  })

  it('should call config.subscribe and return unsubscribe function', () => {
    const unsubscribe = vi.fn()
    const mockConfig = {
      getNode: vi.fn().mockReturnValue({}),
      subscribe: vi.fn().mockReturnValue(unsubscribe),
    }

    const result = watchNodeClient(mockConfig as any, { onChange: vi.fn() })

    expect(mockConfig.subscribe).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
    )
    expect(result).toBe(unsubscribe)
  })

  it('should handle missing node gracefully', () => {
    const unsubscribe = vi.fn()
    const mockConfig = {
      getNode: vi.fn().mockImplementation(() => {
        throw new Error('no node')
      }),
      subscribe: vi.fn().mockReturnValue(unsubscribe),
    }

    const result = watchNodeClient(mockConfig as any, { onChange: vi.fn() })

    expect(result).toBe(unsubscribe)
  })
})
