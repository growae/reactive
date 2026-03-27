import type { Config, Connection, Connector } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type DisconnectParameters = {
  connector?: Connector | undefined
}

export type DisconnectReturnType = void

export type DisconnectErrorType = BaseErrorType | ErrorType

export async function disconnect(
  config: Config,
  parameters: DisconnectParameters = {},
): Promise<DisconnectReturnType> {
  let connector: Connector | undefined
  if (parameters.connector) {
    connector = parameters.connector
  } else {
    const { connections, current } = config.state
    const connection = connections.get(current!)
    connector = connection?.connector
  }

  const connections = config.state.connections

  if (connector) {
    await connector.disconnect()
    connector.emitter.off('change', config._internal.events.change)
    connector.emitter.off('disconnect', config._internal.events.disconnect)
    connector.emitter.on('connect', config._internal.events.connect)

    connections.delete(connector.uid)
  }

  config.setState((x) => {
    if (connections.size === 0) {
      return {
        ...x,
        connections: new Map(),
        current: null,
        status: 'disconnected' as const,
      }
    }

    const nextConnection = connections.values().next().value as Connection
    return {
      ...x,
      connections: new Map(connections),
      current: nextConnection.connector.uid,
    }
  })

  const current = config.state.current
  if (!current) return
  const currentConnector = config.state.connections.get(current)?.connector
  if (!currentConnector) return
  await config.storage?.setItem('recentConnectorId', currentConnector.id)
}
