import type { Config, Connector } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type SignTransactionParameters = {
  tx: string
  networkId?: string | undefined
  innerTx?: boolean | undefined
  connector?: Connector | undefined
}

export type SignTransactionReturnType = string

export type SignTransactionErrorType = BaseErrorType | ErrorType

export async function signTransaction(
  config: Config,
  parameters: SignTransactionParameters,
): Promise<SignTransactionReturnType> {
  const { tx, innerTx } = parameters
  const networkId = parameters.networkId ?? config.state.networkId

  let connector: Connector | undefined = parameters.connector
  if (!connector) {
    const { connections, current } = config.state
    const connection = current ? connections.get(current) : undefined
    connector = connection?.connector
  }

  if (!connector) {
    throw new Error('No connector found. Connect a wallet first.')
  }

  if (!connector.signTransaction) {
    throw new Error('Connector does not support transaction signing.')
  }

  return connector.signTransaction({
    tx,
    networkId,
    innerTx,
  })
}
