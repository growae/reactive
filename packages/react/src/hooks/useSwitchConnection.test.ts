// @vitest-environment jsdom
import {
  connect,
  createConfig,
  getConnection,
  mock,
  testnet,
} from '@growae/reactive'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { expect, it } from 'vitest'
import { useSwitchConnection } from '../exports/index.js'

it('switches an open wallet and keeps it selected when another connector is unavailable', async () => {
  const config = createConfig({
    networks: [testnet],
    connectors: ['ak_first', 'ak_second', 'ak_offline'].map((address) =>
      mock({ accounts: [address] }),
    ),
    storage: null,
  })
  const [first, second, offline] = config.connectors
  await connect(config, { connector: first! })
  await connect(config, { connector: second! })
  const client = new QueryClient()
  const { result } = renderHook(() => useSwitchConnection({ config }), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  })
  expect(result.current.connections.size).toBe(2)
  await act(() => result.current.switchConnectionAsync({ connector: first! }))
  expect(getConnection(config)?.connector.uid).toBe(first!.uid)
  await act(async () => {
    await expect(
      result.current.switchConnectionAsync({ connector: offline! }),
    ).rejects.toThrow()
  })
  expect(getConnection(config)?.connector.uid).toBe(first!.uid)
})
