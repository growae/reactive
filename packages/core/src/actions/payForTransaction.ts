import { buildTxAsync, Tag } from '@aeternity/aepp-sdk'
import type { Config, Connector } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { DEFAULT_TTL } from '../constants.js'
import { sendTransaction } from './sendTransaction.js'

export type PayForTransactionParameters = {
  innerTx: string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number | undefined
  networkId?: string | undefined
  connector?: Connector | undefined
  waitMined?: boolean | undefined
}

export type PayForTransactionReturnType = {
  hash: string
  rawTx: string
  blockHash?: string
  blockHeight?: number
  tx?: Record<string, any>
}

export type PayForTransactionErrorType = BaseErrorType | ErrorType

export async function payForTransaction(
  config: Config,
  parameters: PayForTransactionParameters,
): Promise<PayForTransactionReturnType> {
  const { innerTx, ttl, networkId, connector, waitMined = true } = parameters

  let payerConnector: Connector | undefined = connector
  if (!payerConnector) {
    const { connections, current } = config.state
    const connection = current ? connections.get(current) : undefined
    payerConnector = connection?.connector
  }

  if (!payerConnector) {
    throw new Error('No connector found. Connect a wallet first.')
  }

  const accounts = await payerConnector.getAccounts()
  const payerId = accounts[0]
  if (!payerId) {
    throw new Error('No account available on the current connector.')
  }

  const node = config.getNodeClient({ networkId })

  const tx = await buildTxAsync({
    tag: Tag.PayingForTx,
    payerId,
    tx: innerTx,
    ttl: ttl ?? DEFAULT_TTL,
    onNode: node,
  })

  return sendTransaction(config, {
    tx,
    networkId,
    connector: payerConnector,
    waitMined,
  })
}
