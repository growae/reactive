import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { createComponent } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { useConnect } from './useConnect'

function createMockConfig() {
  return {
    _internal: { ssr: false },
    state: {
      networkId: 'ae_uat',
      status: 'disconnected',
      connections: new Map(),
      current: null,
    },
    subscribe: vi.fn(() => vi.fn()),
    getState: vi.fn(() => ({
      status: 'disconnected',
      connections: new Map(),
      current: null,
      networkId: 'ae_uat',
    })),
    connectors: [],
  } as any
}

function withQueryClient(fn: () => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  createComponent(QueryClientProvider, {
    client: queryClient,
    get children() {
      fn()
      return null
    },
  })
}

describe('useConnect', () => {
  it('should be a function', () => {
    expect(typeof useConnect).toBe('function')
  })

  it('should accept config parameter', () => {
    const mockConfig = createMockConfig()
    expect(() => {
      withQueryClient(() => {
        useConnect(() => ({ config: mockConfig }))
      })
    }).not.toThrow()
  })

  it('should return mutation object with expected methods', () => {
    const mockConfig = createMockConfig()
    let result: any
    withQueryClient(() => {
      result = useConnect(() => ({ config: mockConfig }))
    })
    expect(result).toBeDefined()
    expect(typeof result.mutate).toBe('function')
    expect(typeof result.mutateAsync).toBe('function')
    expect(typeof result.reset).toBe('function')
  })
})
