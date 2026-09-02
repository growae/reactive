// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig, mock, testnet } from '@growae/reactive'
import { renderHook } from '@testing-library/react'
import { createElement, useState } from 'react'
import { ReactiveProvider } from '../context'
import { type UseConfigParameters, useConfig } from './useConfig'

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

  // useContext must not sit behind `??`. React reports a skipped hook as a
  // console.error rather than throwing, so asserting on the render result alone
  // passes against the broken form — the spy is what makes this a regression test.
  it('should keep a stable hook order when the config parameter changes', () => {
    const errors: unknown[][] = []
    const spy = vi
      .spyOn(console, 'error')
      .mockImplementation((...args: unknown[]) => {
        errors.push(args)
      })
    const config = createTestConfig()
    const { result, rerender } = renderHook(
      ({ parameters }) => {
        const resolved = useConfig(parameters)
        const [marker] = useState('after')
        return { resolved, marker }
      },
      {
        initialProps: {
          parameters: { config } as UseConfigParameters,
        },
        wrapper: ({ children }) =>
          createElement(
            ReactiveProvider,
            { config, reconnectOnMount: false },
            children,
          ),
      },
    )
    expect(result.current.resolved).toBe(config)

    rerender({ parameters: {} })
    spy.mockRestore()

    expect(result.current.resolved).toBe(config)
    expect(result.current.marker).toBe('after')
    expect(
      errors.filter((args) => String(args[0]).includes('order of Hooks')),
    ).toEqual([])
  })
})
