import { afterEach, describe, expect, it, vi } from 'vitest'
import { memory } from '../connectors/memory.js'
import { createConfig } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import { NodeRequestError } from '../node.js'
import { testnet } from '../types/network.js'
import { buildTransaction } from './buildTransaction.js'
import {
  CallsSubmissionError,
  getCallsStatus,
  sendCalls,
  waitForCallsStatus,
} from './calls.js'
import { connect } from './connect.js'

afterEach(() => vi.useRealTimers())
async function wallet() {
  const { keys, tx } = await loadProtocol()
  const [secretKey, address] = keys.fromSeed(new Uint8Array(32).fill(7))
  const config = createConfig({
    networks: [testnet],
    storage: null,
    connectors: [memory({ accounts: [{ secretKey }] })],
  })
  const connector = config.connectors[0]!
  await connect(config, { connector })
  const build = (nonce: number) =>
    buildTransaction(config, {
      tag: 'SpendTx',
      fields: [
        { key: 'senderId', value: { tag: 'encoded', val: address } },
        { key: 'recipientId', value: { tag: 'encoded', val: address } },
        { key: 'nonce', value: { tag: 'uint', val: String(nonce) } },
        { key: 'amount', value: { tag: 'uint', val: '1' } },
      ],
    })
  return {
    config,
    connector,
    tx,
    node: config.getNodeClient({}),
    calls: await Promise.all([build(1), build(2)]),
  }
}
describe('AE transaction groups', () => {
  it('rejects an atomic group or malformed later item before asking for a signature', async () => {
    const { config, connector, calls, node } = await wallet()
    const sign = vi.spyOn(connector, 'signTransaction')
    const post = vi.spyOn(node, 'postTransaction')
    await expect(
      sendCalls(config, { calls, atomicRequired: true }),
    ).rejects.toThrow(/atomic/)
    await expect(
      sendCalls(config, { calls: [calls[0]!, 'invalid'] }),
    ).rejects.toThrow(/unsigned/)
    expect(sign).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })
  it('preserves the signed hash when the second POST loses its acknowledgement', async () => {
    const { config, calls, node, tx } = await wallet()
    const sent: string[] = []
    vi.spyOn(node, 'postTransaction').mockImplementation(
      async ({ tx: signed }) => {
        const hash = tx.transactionHash(signed)
        sent.push(hash)
        if (sent.length === 2) throw new Error('Connection lost')
        return { txHash: hash }
      },
    )
    let failure: unknown
    try {
      await sendCalls(config, { calls })
    } catch (error) {
      failure = error
    }
    expect(failure).toBeInstanceOf(CallsSubmissionError)
    const e = failure as CallsSubmissionError
    expect(e.index).toBe(1)
    expect(e.group).toEqual({ networkId: testnet.id, hashes: sent })
    vi.spyOn(node, 'getTransactionByHash').mockImplementation(async (hash) => {
      if (hash === sent[1]) throw new NodeRequestError(404, 'Unknown')
      return {
        hash,
        blockHeight: 15,
        blockHash: 'mh_1',
        tx: {},
        signatures: [],
      }
    })
    const status = await getCallsStatus(config, { group: e.group })
    expect(status.transactions.map((t) => t.status)).toEqual([
      'included',
      'unknown',
    ])
    expect(status.included).toBe(false)
  })
  it('aborts a pending poll on caller cancellation and on deadline', async () => {
    const { config, node } = await wallet()
    const pending = vi.spyOn(node, 'getTransactionByHash').mockImplementation(
      (_hash, signal) =>
        new Promise((_resolve, reject) => {
          signal!.addEventListener('abort', () => reject(signal!.reason), {
            once: true,
          })
        }),
    )
    const group = { networkId: testnet.id, hashes: ['th_pending'] }
    const cancel = new AbortController()
    const stopped = waitForCallsStatus(config, { group, signal: cancel.signal })
    cancel.abort(new Error('unmounted'))
    await expect(stopped).rejects.toThrow('unmounted')
    vi.useFakeTimers()
    const bounded = expect(
      waitForCallsStatus(config, { group, timeout: 10 }),
    ).rejects.toThrow(/Timed out/)
    await vi.advanceTimersByTimeAsync(10)
    await bounded
    expect(pending).toHaveBeenCalledTimes(2)
  })
})
