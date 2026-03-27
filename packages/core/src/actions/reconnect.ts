import type { CreateConnectorFn } from '../connectors/createConnector'
import type { Config, Connection, Connector } from '../createConfig'
import type { ErrorType } from '../errors/base'

export type ReconnectParameters = {
  connectors?: readonly (CreateConnectorFn | Connector)[] | undefined
}

export type ReconnectReturnType = Connection[]

export type ReconnectErrorType = ErrorType

let isReconnecting = false

export async function reconnect(
  config: Config,
  parameters: ReconnectParameters = {},
): Promise<ReconnectReturnType> {
  if (isReconnecting) return []
  isReconnecting = true

  config.setState((x) => ({
    ...x,
    status: x.current ? 'reconnecting' : 'connecting',
  }))

  const connectors: Connector[] = []
  if (parameters.connectors?.length) {
    for (const connectorOrFn of parameters.connectors) {
      let connector: Connector
      if (typeof connectorOrFn === 'function') {
        connector = config._internal.connectors.setup(connectorOrFn)
      } else {
        connector = connectorOrFn
      }
      connectors.push(connector)
    }
  } else {
    connectors.push(...config.connectors)
  }

  let recentConnectorId: string | null | undefined
  try {
    recentConnectorId = await config.storage?.getItem('recentConnectorId')
  } catch {}

  const scores: Record<string, number> = {}
  for (const [, connection] of config.state.connections) {
    scores[connection.connector.id] = 1
  }
  if (recentConnectorId) scores[recentConnectorId] = 0

  const sorted =
    Object.keys(scores).length > 0
      ? [...connectors].sort(
          (a, b) => (scores[a.id] ?? 10) - (scores[b.id] ?? 10),
        )
      : connectors

  let connected = false
  const connections: Connection[] = []
  const providers: unknown[] = []

  for (const connector of sorted) {
    const provider = await connector.getProvider().catch(() => undefined)
    if (!provider) continue
    if (providers.some((x) => x === provider)) continue

    const isAuthorized = await connector.isAuthorized()
    if (!isAuthorized) continue

    const data = await connector
      .connect({ isReconnecting: true })
      .catch(() => null)
    if (!data) continue

    connector.emitter.off('connect', config._internal.events.connect)
    connector.emitter.on('change', config._internal.events.change)
    connector.emitter.on('disconnect', config._internal.events.disconnect)

    config.setState((x) => {
      const updatedConnections = new Map(
        connected ? x.connections : new Map(),
      ).set(connector.uid, {
        accounts: data.accounts as readonly [string, ...string[]],
        networkId: data.networkId,
        connector,
      })
      return {
        ...x,
        current: connected ? x.current : connector.uid,
        connections: updatedConnections,
      }
    })

    connections.push({
      accounts: data.accounts as readonly [string, ...string[]],
      networkId: data.networkId,
      connector,
    })
    providers.push(provider)
    connected = true
  }

  if (
    config.state.status === 'reconnecting' ||
    config.state.status === 'connecting'
  ) {
    if (!connected) {
      config.setState((x) => ({
        ...x,
        connections: new Map(),
        current: null,
        status: 'disconnected' as const,
      }))
    } else {
      config.setState((x) => ({ ...x, status: 'connected' as const }))
    }
  }

  isReconnecting = false
  return connections
}
