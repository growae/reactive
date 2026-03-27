// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createElement } from 'react'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useConnect } from './useConnect.js'
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
