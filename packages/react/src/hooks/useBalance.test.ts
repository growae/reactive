// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive'
import { mock } from '@growae/reactive'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { ReactiveProvider } from '../context.js'
import { useBalance } from './useBalance.js'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

function createWrapper() {
  const config = createConfig({
    networks: [testnet],
    connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
    storage: null,
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    config,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          ReactiveProvider,
          { config, reconnectOnMount: false },
          children,
        ),
      ),
  }
}

describe('useBalance', () => {
  it('should return query result shape', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useBalance({
          address: 'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
        }),
      { wrapper },
    )

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('queryKey')
  })

  it('should be idle without address', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useBalance({} as any), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
