import { expect, it } from 'vitest'
import { createConfig } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import { testnet } from '../types/network.js'
import { buildTransaction, type TransactionField } from './buildTransaction.js'

it('builds offline and fills the minimum fee in Rust', async () => {
  const config = createConfig({ networks: [testnet], storage: null })
  const { tx, keys } = await loadProtocol()
  const [, address] = keys.fromSeed(new Uint8Array(32).fill(1))
  const fields: TransactionField[] = [
    { key: 'senderId', value: { tag: 'encoded', val: address } },
    { key: 'recipientId', value: { tag: 'encoded', val: address } },
    { key: 'amount', value: { tag: 'uint', val: '1' } },
    { key: 'nonce', value: { tag: 'uint', val: '1' } },
  ]
  const encoded = await buildTransaction(config, { tag: 'SpendTx', fields })
  expect(
    tx.unpack(encoded)[2].find((field) => field.key === 'fee')?.value,
  ).toEqual({ tag: 'uint', val: tx.minimumFee('SpendTx', undefined, fields) })
})
