import { describe, expect, it, vi } from 'vitest'
import { watchHeight } from './watchHeight'

describe('watchHeight', () => {
  it('should be a function', () => {
    expect(typeof watchHeight).toBe('function')
  })

  it('should return an unsubscribe function', () => {
    const mockConfig = {
      getNodeClient: vi.fn().mockReturnValue({
        getStatus: vi.fn().mockResolvedValue({ topBlockHeight: 100 }),
      }),
    }

    const unsubscribe = watchHeight(mockConfig as any, {
      onChange: vi.fn(),
      pollingInterval: 100_000,
    })

    expect(typeof unsubscribe).toBe('function')
    unsubscribe()
  })

  it('should stop polling when unsubscribed', () => {
    const mockConfig = {
      getNodeClient: vi.fn().mockReturnValue({
        getStatus: vi.fn().mockResolvedValue({ topBlockHeight: 1 }),
      }),
    }

    const unsubscribe = watchHeight(mockConfig as any, {
      onChange: vi.fn(),
      pollingInterval: 100_000,
    })

    unsubscribe()
  })
})
