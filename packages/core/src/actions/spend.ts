import { Tag, buildTx } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type SpendParameters = {
  recipientId: string
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
    recipientId,
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

  const spendTx = buildTx({
    tag: Tag.SpendTx,
    senderId,
    recipientId,
    amount: BigInt(amount),
    payload: payload ?? '',
    fee: txOptions.fee ? BigInt(txOptions.fee) : undefined,
    ttl: txOptions.ttl ?? DEFAULT_TTL,
    nonce,
  })

  const connector = connection.connector
  if (!connector.signTransaction) {
    throw new Error('Connector does not support transaction signing')
  }

  const signed = await connector.signTransaction({
    tx: spendTx,
    networkId: networkId ?? config.state.networkId,
  })

  const result = await node.postTransaction({ tx: signed })

  return {
    hash: result.txHash,
    rawTx: signed,
  }
}
