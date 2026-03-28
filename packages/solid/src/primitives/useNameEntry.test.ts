import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { createComponent } from 'solid-js'
import { renderToStringAsync } from 'solid-js/web'
import { describe, expect, it, vi } from 'vitest'
import { useNameEntry } from './useNameEntry'

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
    getNodeClient: vi.fn(() => ({})),
  } as any
}

async function withQueryClient<T>(fn: () => T): Promise<T> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  let result: T
  await renderToStringAsync(() =>
    createComponent(QueryClientProvider, {
      client: queryClient,
      get children() {
        result = fn()
        return ''
      },
    }),
  )
  return result!
}

describe('useNameEntry', () => {
  it('should be a function', () => {
    expect(typeof useNameEntry).toBe('function')
  })

  it('should accept parameters as Accessor', async () => {
    const mockConfig = createMockConfig()
    await expect(
      withQueryClient(() =>
        useNameEntry(() => ({
          name: 'test.chain',
          config: mockConfig,
        })),
      ),
    ).resolves.toBeDefined()
  })

  it('should return query result with expected shape', async () => {
    const mockConfig = createMockConfig()
    const result = await withQueryClient(() =>
      useNameEntry(() => ({
        name: 'test.chain',
        config: mockConfig,
      })),
    )
    expect(result).toBeDefined()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('isLoading')
    expect(result).toHaveProperty('isError')
    expect(result).toHaveProperty('isSuccess')
  })
})
