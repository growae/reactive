// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createElement } from 'react'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBalance } from './useBalance.js'
import { ReactiveProvider } from '../context.js'
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core'
import { mock } from '@reactive/core'

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
          address:
            'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
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
    const { result } = renderHook(
      () => useBalance({} as any),
      { wrapper },
    )
    expect(result.current.fetchStatus).toBe('idle')
  })
})
