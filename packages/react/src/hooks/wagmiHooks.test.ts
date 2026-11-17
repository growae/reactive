// @vitest-environment jsdom
import {
  connect,
  createConfig,
  disconnect,
  mainnet,
  mock,
  testnet,
} from '@growae/reactive'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { createUseReadContract } from '../exports/codegen.js'
import {
  useCapabilities,
  useConnectionEffect,
  useContractEvents,
  useGasPrice,
  useReadContracts,
  useShowCallsStatus,
  useWalletClient,
  useWatchAsset,
  useWatchBlocks,
} from '../exports/index.js'

// jsdom runs in Node but Vite gives assets browser URLs. Load the same generated
// ESM with Node's resolver so jco resolves its WASM beside the real file.
vi.mock('@growae/reactive/protocol', async () => {
  const { createRequire } = await import('node:module')
  const load = createRequire(import.meta.url)
  const runtime = load('../../../core/protocol-generated/core-harness.js')
  return {
    loadProtocol: async () => {
      await runtime.$init
      return runtime
    },
  }
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
function setup() {
  const base = mock({ accounts: ['ak_first'] })
  const watchAsset = vi.fn().mockResolvedValue(true)
  const showCallsStatus = vi.fn().mockResolvedValue(undefined)
  const config = createConfig({
    networks: [mainnet, testnet],
    storage: null,
    connectors: [
      base,
      (options) => ({ ...base(options), watchAsset, showCallsStatus }),
    ],
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    config,
    client,
    watchAsset,
    showCallsStatus,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  }
}

it('separates gas price observations by network, window, and enabled state', async () => {
  const { config, wrapper } = setup()
  const read = vi
    .spyOn(
      config.getNodeClient({ networkId: testnet.id }),
      'getRecentGasPrices',
    )
    .mockResolvedValue([
      { minutes: 5, minGasPrice: '1000000000000000005', utilization: 9 },
      { minutes: 1, minGasPrice: 12, utilization: 1 },
    ])
  const { result, rerender } = renderHook(
    ({ enabled, minutes }: { enabled: boolean; minutes: number }) =>
      useGasPrice({ config, enabled, minutes, networkId: testnet.id }),
    { initialProps: { enabled: false, minutes: 5 }, wrapper },
  )
  expect(read).not.toHaveBeenCalled()
  rerender({ enabled: true, minutes: 5 })
  await waitFor(() => expect(result.current.data).toBe('1000000000000000005'))
  rerender({ enabled: true, minutes: 1 })
  await waitFor(() => expect(result.current.data).toBe('12'))
})

it('observes actual connect/disconnect edges and unsubscribes without reporting wallet switches', async () => {
  const { config, wrapper } = setup()
  const onConnect = vi.fn()
  const onDisconnect = vi.fn()
  const { unmount } = renderHook(
    () => useConnectionEffect({ config, onConnect, onDisconnect }),
    { wrapper },
  )
  await act(() => connect(config, { connector: config.connectors[0]! }))
  await act(() => connect(config, { connector: config.connectors[1]! }))
  expect(onConnect).toHaveBeenCalledTimes(1)
  expect(onConnect.mock.calls[0]![0].isReconnected).toBe(false)
  await act(() => disconnect(config, { connector: config.connectors[0]! }))
  expect(onDisconnect).not.toHaveBeenCalled()
  await act(() => disconnect(config, { connector: config.connectors[1]! }))
  expect(onDisconnect).toHaveBeenCalledOnce()
  unmount()
  await connect(config, { connector: config.connectors[0]! })
  expect(onConnect).toHaveBeenCalledOnce()
})

it('requests only operations advertised by the connected wallet', async () => {
  const { config, wrapper, watchAsset, showCallsStatus } = setup()
  const connector = config.connectors[1]!
  await connect(config, { connector, networkId: testnet.id })
  const { result } = renderHook(
    () => ({
      capabilities: useCapabilities({ config }),
      wallet: useWalletClient({ config }),
      asset: useWatchAsset({ config }),
      status: useShowCallsStatus({ config }),
    }),
    { wrapper },
  )
  await waitFor(() =>
    expect(result.current.capabilities.data?.watchAsset).toBe(true),
  )
  expect(result.current.wallet.data?.account).toBe('ak_first')
  await act(() => result.current.asset.watchAssetAsync({ token: 'ct_token' }))
  const group = { networkId: testnet.id, hashes: ['th_example'] }
  await act(() => result.current.status.showCallsStatusAsync({ group }))
  expect(watchAsset).toHaveBeenCalledWith({
    token: 'ct_token',
    networkId: testnet.id,
    onAccount: 'ak_first',
  })
  expect(showCallsStatus).toHaveBeenCalledWith({ group, onAccount: 'ak_first' })
})

it('does not notify after a block watcher unmounts during a request', async () => {
  const { config, wrapper } = setup()
  const onBlock = vi.fn()
  const node = config.getNodeClient({})
  type Block = Awaited<ReturnType<typeof node.getCurrentKeyBlock>>
  let resolve!: (block: Block) => void
  vi.spyOn(node, 'getCurrentKeyBlock').mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const hook = renderHook(
    () => useWatchBlocks({ config, onBlock, emitOnBegin: true, interval: 100 }),
    { wrapper },
  )
  hook.unmount()
  await act(async () => resolve({ hash: 'kh_late' } as Block))
  expect(onBlock).not.toHaveBeenCalled()
})

it('binds a named Sophia read and batches reads in one dry-run', async () => {
  const { config, wrapper } = setup()
  const node = config.getNodeClient({ networkId: testnet.id })
  const { loadProtocol } = await import('@growae/reactive/protocol')
  const { fate, encoding } = await loadProtocol()
  const value = encoding.encode(
    fate.encodeValue({ tag: 'integer', val: '8' }),
    'cb',
  )
  const dry = vi.spyOn(node, 'dryRun').mockImplementation(async (p) => ({
    results: p.txs.map(() => ({
      result: 'ok',
      callObj: { returnType: 'ok', returnValue: value } as any,
    })),
  }))
  const useEcho = createUseReadContract({
    address: 'ct_contract',
    function: 'echo',
    networkId: testnet.id,
  })
  const { result } = renderHook(
    () => ({
      one: useEcho({ config, networkId: mainnet.id, args: [8n] }),
      two: useReadContracts({
        config,
        networkId: testnet.id,
        contracts: [
          { address: 'ct_a', function: 'echo', args: [8n] },
          { address: 'ct_b', function: 'echo', args: [8n] },
        ],
      }),
    }),
    { wrapper },
  )
  await waitFor(() => expect(result.current.two.data).toEqual([value, value]))
  await waitFor(() => expect(result.current.one.data).toBe(value))
  expect(dry.mock.calls.map(([p]) => p.txs.length).sort()).toEqual([1, 2])
})

it('queries middleware with a height range, an event filter and an opaque cursor', async () => {
  const { config, wrapper } = setup()
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [],
        next: '/v3/contracts/logs?cursor=next%2Bpage',
        prev: null,
      }),
    ),
  )
  vi.stubGlobal('fetch', fetch)
  const { result } = renderHook(
    () =>
      useContractEvents({
        config,
        networkId: testnet.id,
        address: 'ct_test',
        event: 'Transfer',
        fromHeight: 4,
        toHeight: 9,
        limit: 10,
      }),
    { wrapper },
  )
  await waitFor(() => expect(result.current.data?.nextCursor).toBe('next+page'))
  const url = new URL(fetch.mock.calls[0]![0] as string)
  expect(url.pathname).toBe('/mdw/v3/contracts/logs')
  expect(Object.fromEntries(url.searchParams)).toEqual({
    contract_id: 'ct_test',
    event: 'Transfer',
    scope: 'gen:4-9',
    limit: '10',
  })
})
