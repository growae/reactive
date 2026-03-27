import type { Config, Connector } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { ConnectorNotFoundError } from '../errors/config.js'

export type SwitchConnectionParameters = {
  connector: Connector
}

export type SwitchConnectionReturnType = void

export type SwitchConnectionErrorType = BaseErrorType | ErrorType

export function switchConnection(
  config: Config,
  parameters: SwitchConnectionParameters,
): SwitchConnectionReturnType {
  const { connector } = parameters
  const connection = config.state.connections.get(connector.uid)
  if (!connection) {
    throw new ConnectorNotFoundError()
  }

  config.setState((x) => ({
    ...x,
    current: connector.uid,
  }))
}
