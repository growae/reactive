// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '@growae/reactive'
import { mainnet, testnet } from '@growae/reactive'
import { mock } from '@growae/reactive'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { ReactiveProvider } from '../context'
import { useNetworkId } from './useNetworkId'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

function createTestConfig() {
  return createConfig({
    networks: [testnet, mainnet],
    connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
    storage: null,
  })
}

describe('useNetworkId', () => {
  it('should return current network id', () => {
    const config = createTestConfig()
    const { result } = renderHook(() => useNetworkId(), {
      wrapper: ({ children }) =>
        createElement(
          ReactiveProvider,
          { config, reconnectOnMount: false },
          children,
        ),
    })
    expect(result.current).toBe('ae_uat')
  })

  it('should accept config parameter directly', () => {
    const config = createTestConfig()
    const { result } = renderHook(() => useNetworkId({ config }), {
      wrapper: ({ children }) =>
        createElement(
          ReactiveProvider,
          { config, reconnectOnMount: false },
          children,
        ),
    })
    expect(result.current).toBe('ae_uat')
  })
})
