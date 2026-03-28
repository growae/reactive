import type { Config, Connection, Connector } from '../createConfig'

export type GetActiveAccountReturnType =
  | {
      address: string
      addresses: readonly [string, ...string[]]
      connector: Connector
      isConnected: true
    }
  | {
      address: undefined
      addresses: undefined
      connector: undefined
      isConnected: false
    }

export function getActiveAccount(config: Config): GetActiveAccountReturnType {
  const { connections, current } = config.state
  const connection: Connection | undefined = current
    ? connections.get(current)
    : undefined

  if (!connection) {
    return {
      address: undefined,
      addresses: undefined,
      connector: undefined,
      isConnected: false,
    }
  }

  return {
    address: connection.activeAccount,
    addresses: connection.accounts,
    connector: connection.connector,
    isConnected: true,
  }
}
