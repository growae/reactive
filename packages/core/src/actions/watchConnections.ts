import type { Config, Connection } from '../createConfig'

export type WatchConnectionsParameters = {
  onChange: (
    connections: Map<string, Connection>,
    prevConnections: Map<string, Connection>,
  ) => void
}

export type WatchConnectionsReturnType = () => void

export function watchConnections(
  config: Config,
  parameters: WatchConnectionsParameters,
): WatchConnectionsReturnType {
  const { onChange } = parameters
  return config.subscribe((state) => state.connections, onChange)
}
