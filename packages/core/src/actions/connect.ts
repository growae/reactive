import type { CreateConnectorFn } from '../connectors/createConnector.js'
import type { Config, Connector } from '../createConfig.js'
import {
  ConnectorAlreadyConnectedError,
  type ConnectorAlreadyConnectedErrorType,
} from '../errors/config.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type ConnectParameters = {
  connector: Connector | CreateConnectorFn
  networkId?: string | undefined
}

export type ConnectReturnType = {
  accounts: readonly string[]
  networkId: string
}

export type ConnectErrorType =
  | ConnectorAlreadyConnectedErrorType
  | BaseErrorType
  | ErrorType

export async function connect(
  config: Config,
  parameters: ConnectParameters,
): Promise<ConnectReturnType> {
  let connector: Connector
  if (typeof parameters.connector === 'function') {
    connector = config._internal.connectors.setup(parameters.connector)
  } else {
    connector = parameters.connector
  }

  if (connector.uid === config.state.current) {
    throw new ConnectorAlreadyConnectedError()
  }

  try {
    config.setState((x) => ({ ...x, status: 'connecting' }))
    connector.emitter.emit('message', { type: 'connecting' })

    const data = await connector.connect({
      networkId: parameters.networkId,
    })

    connector.emitter.off('connect', config._internal.events.connect)
    connector.emitter.on('change', config._internal.events.change)
    connector.emitter.on('disconnect', config._internal.events.disconnect)

    await config.storage?.setItem('recentConnectorId', connector.id)

    config.setState((x) => ({
      ...x,
      connections: new Map(x.connections).set(connector.uid, {
        accounts: data.accounts,
        connector,
      }),
      current: connector.uid,
      status: 'connected',
    }))

    return {
      accounts: data.accounts,
      networkId: parameters.networkId ?? config.state.networkId,
    }
  } catch (error) {
    config.setState((x) => ({
      ...x,
      status: x.current ? 'connected' : 'disconnected',
    }))
    throw error
  }
}
