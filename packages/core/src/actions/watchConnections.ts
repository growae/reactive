import type { Config } from '../createConfig.js'

export type WatchConnectionsParameters = {
  onChange: (
    connections: Map<string, import('../createConfig.js').Connection>,
    prevConnections: Map<string, import('../createConfig.js').Connection>,
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
