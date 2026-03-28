import { Tag, buildTxAsync } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants'
import type { Config, Connector } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'
import { sendTransaction } from './sendTransaction'

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
  let payerId: string | undefined
  if (!payerConnector) {
    const { connections, current } = config.state
    const connection = current ? connections.get(current) : undefined
    payerConnector = connection?.connector
    payerId = connection?.activeAccount
  }

  if (!payerConnector) {
    throw new Error('No connector found. Connect a wallet first.')
  }

  if (!payerId) {
    payerId = (await payerConnector.getAccounts())[0]
  }
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
