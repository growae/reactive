import { DEFAULT_TTL } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { loadProtocol } from '../exports/protocol.js'

export type SpendParameters = {
  recipient: string
  amount: bigint | string
  payload?: string | undefined
  networkId?: string | undefined
  options?: {
    fee?: bigint | undefined
    ttl?: number | undefined
    nonce?: number | undefined
  }
}

export type SpendReturnType = {
  hash: string
  rawTx: string
}

export type SpendErrorType = BaseErrorType | ErrorType

export async function spend(
  config: Config,
  parameters: SpendParameters,
): Promise<SpendReturnType> {
  const {
    recipient,
    amount,
    payload,
    networkId,
    options: txOptions = {},
  } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const node = config.getNodeClient({ networkId })

  const senderId = connection.activeAccount
  if (!senderId) throw new Error('No account available')

  const accountInfo = await node.getAccountByPubkey(senderId)
  const nonce = txOptions.nonce ?? accountInfo.nonce + 1

  // An explicit TTL is an absolute height (zero disables expiry).
  const ttl =
    txOptions.ttl ??
    (await node.getCurrentKeyBlockHeight()).height + DEFAULT_TTL
  const { tx, aens } = await loadProtocol()
  const recipientId = aens.isName(recipient)
    ? aens.produceNameId(recipient)
    : recipient
  const fields: Parameters<typeof tx.build>[2] = [
    { key: 'senderId', value: { tag: 'encoded', val: senderId } },
    { key: 'recipientId', value: { tag: 'encoded', val: recipientId } },
    { key: 'amount', value: { tag: 'uint', val: BigInt(amount).toString() } },
    { key: 'ttl', value: { tag: 'uint', val: String(ttl) } },
    { key: 'nonce', value: { tag: 'uint', val: String(nonce) } },
  ]
  if (payload)
    fields.push({ key: 'payload', value: { tag: 'encoded', val: payload } })
  const minimum = BigInt(tx.minimumFee('SpendTx', undefined, fields))
  const fee = txOptions.fee || minimum
  if (fee < minimum)
    throw new RangeError(`Spend fee must be at least ${minimum} aettos`)
  fields.push({ key: 'fee', value: { tag: 'uint', val: fee.toString() } })
  const spendTx = tx.build('SpendTx', undefined, fields)

  const connector = connection.connector
  if (!connector.signTransaction) {
    throw new Error('Connector does not support transaction signing')
  }

  const signed = await connector.signTransaction({
    tx: spendTx,
    networkId: networkId ?? config.state.networkId,
    onAccount: senderId,
  })

  const result = await node.postTransaction({ tx: signed })

  return {
    hash: result.txHash,
    rawTx: signed,
  }
}
