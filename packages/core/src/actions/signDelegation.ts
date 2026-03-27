import type { Config, Connector } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type SignDelegationParameters = {
  delegation: any
  networkId?: string | undefined
  account?: string | undefined
  connector?: Connector | undefined
}

export type SignDelegationReturnType = string

export type SignDelegationErrorType = BaseErrorType | ErrorType

export async function signDelegation(
  config: Config,
  parameters: SignDelegationParameters,
): Promise<SignDelegationReturnType> {
  const { delegation, account } = parameters
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

  const signDelegationFn = (connector as any).signDelegation
  if (!signDelegationFn) {
    throw new Error(
      `Connector "${connector.name}" does not support delegation signing.`,
    )
  }

  return signDelegationFn(delegation, {
    networkId,
    onAccount: account,
  })
}
