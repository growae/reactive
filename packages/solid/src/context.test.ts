import { describe, it, expect, vi } from 'vitest'
import { ReactiveContext, ReactiveProvider } from './context.js'

describe('ReactiveContext', () => {
  it('should be defined', () => {
    expect(ReactiveContext).toBeDefined()
    expect(ReactiveContext.id).toBeDefined()
  })
})

describe('ReactiveProvider', () => {
  it('should be a function', () => {
    expect(typeof ReactiveProvider).toBe('function')
  })

  it('should accept config prop', () => {
    const mockConfig = {
      _internal: { ssr: false },
      subscribe: vi.fn(() => vi.fn()),
      setState: vi.fn(),
      getState: vi.fn(() => ({
        status: 'disconnected',
        connections: new Map(),
        current: null,
        networkId: 'ae_uat',
      })),
    } as any

    expect(() => {
      ReactiveProvider({
        config: mockConfig,
        get children() {
          return null
        },
      })
    }).not.toThrow()
  })
})
