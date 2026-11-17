// @vitest-environment jsdom
import { createConfig, mainnet, testnet } from '@growae/reactive'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  useMicroBlockTransactionCount,
  useTransactionConfirmations,
} from '../exports/index.js'

function setup() {
  const config = createConfig({ networks: [mainnet, testnet], storage: null })
  const node = config.getNodeClient({ networkId: testnet.id })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { config, node, wrapper }
}

describe('chain counts', () => {
  it('waits for a hash and requests the count on the chosen network', async () => {
    const { config, node, wrapper } = setup()
    const read = vi
      .spyOn(node, 'getMicroBlockTransactionsCountByHash')
      .mockResolvedValue({ count: 0 })
    const { result, rerender } = renderHook(
      ({ hash }: { hash?: string }) =>
        useMicroBlockTransactionCount({ config, hash, networkId: testnet.id }),
      { initialProps: {}, wrapper },
    )
    expect(read).not.toHaveBeenCalled()
    rerender({ hash: 'mh_test' })
    await waitFor(() => expect(result.current.data).toBe(0))
    expect(read).toHaveBeenCalledWith('mh_test')
  })

  it.each([
    [-1, 0],
    [10, 1],
    [7, 4],
  ])('computes inclusion depth at height %i', async (blockHeight, expected) => {
    const { config, node, wrapper } = setup()
    vi.spyOn(node, 'getTransactionByHash').mockResolvedValue({
      blockHeight,
    } as Awaited<ReturnType<typeof node.getTransactionByHash>>)
    const height = vi
      .spyOn(node, 'getCurrentKeyBlockHeight')
      .mockResolvedValue({ height: 10 })
    const { result } = renderHook(
      () =>
        useTransactionConfirmations({
          config,
          hash: 'th_test',
          networkId: testnet.id,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.data).toBe(expected))
    expect(height).toHaveBeenCalledTimes(blockHeight < 0 ? 0 : 1)
  })
})
