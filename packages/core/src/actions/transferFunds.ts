import { Tag, buildTxAsync, unpackTx } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants.js'
import type { Config, Connector } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { getBalance } from './getBalance.js'
import { sendTransaction } from './sendTransaction.js'

export type TransferFundsParameters = {
  fraction: number
  recipient: string
  networkId?: string | undefined
  connector?: Connector | undefined
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number | undefined
  waitMined?: boolean | undefined
}

export type TransferFundsReturnType = {
  hash: string
  rawTx: string
  blockHash?: string
  blockHeight?: number
  tx?: Record<string, any>
}

export type TransferFundsErrorType = BaseErrorType | ErrorType

export async function transferFunds(
  config: Config,
  parameters: TransferFundsParameters,
): Promise<TransferFundsReturnType> {
  const {
    fraction,
    recipient,
    networkId,
    connector,
    ttl,
    waitMined = true,
  } = parameters

  if (fraction < 0 || fraction > 1) {
    throw new Error(`Invalid fraction: ${fraction}. Must be between 0 and 1.`)
  }

  let senderConnector: Connector | undefined = connector
  if (!senderConnector) {
    const { connections, current } = config.state
    const connection = current ? connections.get(current) : undefined
    senderConnector = connection?.connector
  }

  if (!senderConnector) {
    throw new Error('No connector found. Connect a wallet first.')
  }

  const accounts = await senderConnector.getAccounts()
  const senderId = accounts[0]
  if (!senderId) {
    throw new Error('No account available on the current connector.')
  }

  const node = config.getNodeClient({ networkId })

  const balanceStr = await getBalance(config, {
    address: senderId,
    networkId,
    format: 'aettos',
  })
  const balance = BigInt(balanceStr)
  const desiredAmount =
    (balance * BigInt(Math.round(fraction * 1e18))) / BigInt(1e18)

  const estimateTx = await buildTxAsync({
    tag: Tag.SpendTx,
    senderId,
    recipientId: recipient,
    amount: desiredAmount.toString(),
    ttl: ttl ?? DEFAULT_TTL,
    onNode: node,
  })
  const unpacked = unpackTx(estimateTx, Tag.SpendTx)
  const fee = BigInt(unpacked.fee)

  const amount = desiredAmount + fee > balance ? balance - fee : desiredAmount

  const tx = await buildTxAsync({
    tag: Tag.SpendTx,
    senderId,
    recipientId: recipient,
    amount: (amount < 0n ? 0n : amount).toString(),
    ttl: ttl ?? DEFAULT_TTL,
    onNode: node,
  })

  return sendTransaction(config, {
    tx,
    networkId,
    connector: senderConnector,
    waitMined,
  })
}
