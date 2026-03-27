// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createElement } from 'react'
import { renderHook } from '@testing-library/react'
import { useConfig } from './useConfig.js'
import { ReactiveProvider } from '../context.js'
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core'
import { mock } from '@reactive/core'

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
