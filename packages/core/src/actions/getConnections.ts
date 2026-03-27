import type { Config, Connection } from '../createConfig'

export type GetConnectionsReturnType = Map<string, Connection>

export function getConnections(config: Config): GetConnectionsReturnType {
  return config.state.connections
}
