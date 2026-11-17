import { afterEach, expect, it, vi } from 'vitest'
import { getBalance } from './actions/getBalance.js'
import { createConfig } from './createConfig.js'
import { NodeClient, NodeRequestError } from './node.js'
import { testnet } from './types/network.js'

afterEach(() => vi.unstubAllGlobals())

it('reads an integer balance without rounding it in JSON', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response('{"balance":1000000000000000001,"nonce":2}'),
    )
  vi.stubGlobal('fetch', fetch)
  const config = createConfig({ networks: [testnet], storage: null })
  await expect(getBalance(config, { address: 'ak_sample' })).resolves.toBe(
    '1000000000000000001',
  )
  expect(fetch.mock.calls[0]?.[0]).toBe(
    `${testnet.nodeUrl}/v3/accounts/ak_sample`,
  )
})

it('posts JSON and maps the transaction hash', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response('{"tx_hash":"th_sample"}'))
  vi.stubGlobal('fetch', fetch)
  const client = new NodeClient('https://node.example/proxy/')
  await expect(client.postTransaction({ tx: 'tx_sample' })).resolves.toEqual({
    txHash: 'th_sample',
  })
  expect(fetch).toHaveBeenCalledWith(
    'https://node.example/proxy/v3/transactions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"tx":"tx_sample"}',
    },
  )
})

it('retains HTTP failures and escapes path segments', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response('unavailable', { status: 503 }))
  vi.stubGlobal('fetch', fetch)
  await expect(
    new NodeClient('https://node.example').getNameEntryByName('a/b'),
  ).rejects.toBeInstanceOf(NodeRequestError)
  expect(fetch.mock.calls[0]?.[0]).toBe('https://node.example/v3/names/a%2Fb')
})
