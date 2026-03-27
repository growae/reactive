import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { NetworkNotConfiguredError } from '../errors/config.js'

export type SwitchNetworkParameters = {
  networkId: string
}

export type SwitchNetworkReturnType = void

export type SwitchNetworkErrorType = BaseErrorType | ErrorType

export async function switchNetwork(
  config: Config,
  parameters: SwitchNetworkParameters,
): Promise<SwitchNetworkReturnType> {
  const { networkId } = parameters
  const network = config.networks.find((n) => n.networkId === networkId)
  if (!network) {
    throw new NetworkNotConfiguredError()
  }

  const { connections, current } = config.state
  if (current) {
    const connection = connections.get(current)
    if (connection?.connector.switchNetwork) {
      await connection.connector.switchNetwork({ networkId })
    }
  }

  config.setState((x) => ({ ...x, networkId }))
}
