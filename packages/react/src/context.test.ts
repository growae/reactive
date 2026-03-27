// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createElement, useContext } from 'react'
import { render, renderHook } from '@testing-library/react'
import { ReactiveProvider, ReactiveContext } from './context.js'
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

describe('ReactiveProvider', () => {
  it('should render children', () => {
    const config = createTestConfig()
    const { container } = render(
      createElement(
        ReactiveProvider,
        { config, reconnectOnMount: false },
        createElement('div', null, 'Hello'),
      ),
    )
    expect(container.textContent).toBe('Hello')
  })

  it('should provide config via context', () => {
    const config = createTestConfig()
    const { result } = renderHook(() => useContext(ReactiveContext), {
      wrapper: ({ children }) =>
        createElement(
          ReactiveProvider,
          { config, reconnectOnMount: false },
          children,
        ),
    })
    expect(result.current).toBe(config)
  })
})
