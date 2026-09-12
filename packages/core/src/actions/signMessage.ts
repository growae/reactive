import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type SignMessageParameters = {
  message: string
  /**
   * The account to sign the message with. Defaults to the active account of
   * the current connection; pass it explicitly to sign with some other account
   * the connector holds.
   */
  onAccount?: string | undefined
}

export type SignMessageReturnType = {
  signature: string
}

export type SignMessageErrorType = BaseErrorType | ErrorType

export async function signMessage(
  config: Config,
  parameters: SignMessageParameters,
): Promise<SignMessageReturnType> {
  const { message } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const connector = connection.connector
  if (!connector.signMessage) {
    throw new Error('Connector does not support message signing')
  }

  // Nothing propagates `switchActiveAccount` to a connector, so without this
  // the connector signs with whichever account it picked itself while the
  // caller verifies against the active one. `signTypedData` already pins the
  // same field; this was the one signing path that named no account at all.
  const onAccount = parameters.onAccount ?? connection.activeAccount

  const signature = await connector.signMessage({ message, onAccount })

  return { signature }
}
