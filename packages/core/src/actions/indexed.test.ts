import { afterEach, expect, it, vi } from 'vitest'
import { createConfig } from '../createConfig.js'
import { testnet } from '../types/network.js'
import { watchContractEvent } from './indexed.js'
import { watchBlocks, watchPendingTransactions } from './observers.js'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
it('rescans the indexed boundary, drains all cursors and emits each new log once', async () => {
  vi.useFakeTimers()
  const config = createConfig({ networks: [testnet], storage: null })
  let height = 10
  const first = {
    block_hash: 'mh_first',
    call_tx_hash: 'th_1',
    log_idx: 0,
    height: 10,
  }
  const second = {
    block_hash: 'mh_second',
    call_tx_hash: 'th_2',
    log_idx: 1,
    height: 11,
  }
  const fetch = vi.fn(async (input: string) => {
    const url = new URL(input)
    if (url.pathname.endsWith('/status'))
      return new Response(JSON.stringify({ mdw_height: height }))
    const cursor = url.searchParams.get('cursor')
    const result =
      height === 10
        ? { data: [first], next: null }
        : cursor
          ? { data: [second], next: null }
          : { data: [first], next: '/v3/contracts/logs?cursor=page2' }
    return new Response(JSON.stringify({ ...result, prev: null }))
  })
  vi.stubGlobal('fetch', fetch)
  const logs = vi.fn()
  const stop = watchContractEvent(config, {
    address: 'ct_example',
    onLogs: logs,
    interval: 10,
  })
  await vi.advanceTimersByTimeAsync(1)
  expect(logs).not.toHaveBeenCalled()
  height = 11
  await vi.advanceTimersByTimeAsync(12)
  expect(logs).toHaveBeenCalledOnce()
  expect(logs.mock.calls[0]![0][0].blockHash).toBe('mh_second')
  stop()
  const requests = fetch.mock.calls.length
  await vi.advanceTimersByTimeAsync(100)
  expect(fetch).toHaveBeenCalledTimes(requests)
})
it('observes same-height replacements and scopes new pending hashes to an account', async () => {
  vi.useFakeTimers()
  const config = createConfig({ networks: [testnet], storage: null })
  const node = config.getNodeClient({})
  type Block = Awaited<ReturnType<typeof node.getCurrentKeyBlock>>
  const heads = vi
    .spyOn(node, 'getCurrentKeyBlock')
    .mockResolvedValueOnce({ height: 4, hash: 'kh_A' } as Block)
    .mockResolvedValue({ height: 4, hash: 'kh_B' } as Block)
  let hashes = ['th_A']
  const pool = vi
    .spyOn(node, 'getPendingAccountTransactions')
    .mockImplementation(async () => ({
      transactions: hashes.map((hash) => ({
        hash,
        blockHeight: -1,
        blockHash: 'none',
        tx: {},
        signatures: [],
      })),
    }))
  const onBlock = vi.fn()
  const onTransactions = vi.fn()
  const stop = watchBlocks(config, { onBlock, interval: 10 })
  const unwatch = watchPendingTransactions(config, {
    address: 'ak_1',
    onTransactions,
    interval: 10,
  })
  await vi.advanceTimersByTimeAsync(1)
  hashes = ['th_A', 'th_B']
  await vi.advanceTimersByTimeAsync(22)
  expect(onBlock).toHaveBeenCalledOnce()
  expect(onBlock.mock.calls[0]!.map((b) => b.hash)).toEqual(['kh_B', 'kh_A'])
  expect(onTransactions.mock.calls).toEqual([[['th_B']]])
  expect(pool).toHaveBeenCalledWith('ak_1')
  expect(heads).toHaveBeenCalledTimes(3)
  stop()
  unwatch()
})
