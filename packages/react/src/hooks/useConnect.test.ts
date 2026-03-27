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
import { useConnect } from './useConnect.js'

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

describe('useConnect', () => {
  it('should return connect function', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useConnect(), { wrapper })
    expect(typeof result.current.connect).toBe('function')
    expect(typeof result.current.connectAsync).toBe('function')
  })

  it('should return connectors', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useConnect(), { wrapper })
    expect(result.current.connectors).toBeDefined()
    expect(result.current.connectors).toHaveLength(1)
  })

  it('should have idle status initially', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useConnect(), { wrapper })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })
})
