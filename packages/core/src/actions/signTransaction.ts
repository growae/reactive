import type { Config, Connector } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { activeAccountForConnector } from '../utils/activeAccount.js'

export type SignTransactionParameters = {
  tx: string
  networkId?: string | undefined
  innerTx?: boolean | undefined
  connector?: Connector | undefined
  /**
   * The account the transaction was built for. Defaults to the active account
   * of the connection the signing connector belongs to; pass it explicitly
   * when the transaction was built for some other account the connector holds.
   */
  onAccount?: string | undefined
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

  // Nothing propagates `switchActiveAccount` to a connector, so without this
  // the connector signs with whichever account it picked itself — for a
  // transaction built against the active one.
  const onAccount =
    parameters.onAccount ?? activeAccountForConnector(config, connector)

  return connector.signTransaction({
    tx,
    networkId,
    innerTx,
    onAccount,
  })
}
