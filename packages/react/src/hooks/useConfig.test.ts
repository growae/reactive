// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive'
import { mock } from '@growae/reactive'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { ReactiveProvider } from '../context.js'
import { useConfig } from './useConfig.js'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

function createTestConfig() {
  return createConfig({
    networks: [testnet],
    connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
    storage: null,
  })
}

describe('useConfig', () => {
  it('should return config when wrapped in ReactiveProvider', () => {
    const config = createTestConfig()
    const { result } = renderHook(() => useConfig(), {
      wrapper: ({ children }) =>
        createElement(
          ReactiveProvider,
          { config, reconnectOnMount: false },
          children,
        ),
    })
    expect(result.current).toBe(config)
  })

  it('should throw without ReactiveProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useConfig())).toThrow()
    spy.mockRestore()
  })

  it('should accept config via parameter', () => {
    const config = createTestConfig()
    const { result } = renderHook(() => useConfig({ config }))
    expect(result.current).toBe(config)
  })
})
