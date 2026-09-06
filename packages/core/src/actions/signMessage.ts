import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type SignMessageParameters = {
  message: string
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
  const { message, onAccount } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const connector = connection.connector
  if (!connector.signMessage) {
    throw new Error('Connector does not support message signing')
  }

  const signature = await connector.signMessage({ message, onAccount })

  return { signature }
}
