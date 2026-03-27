import type { Config } from '../createConfig.js'

export type WatchConnectionsParameters = {
  onChange: (connections: any[], prevConnections: any[]) => void
}

export type WatchConnectionsReturnType = () => void

export function watchConnections(
  config: Config,
  parameters: WatchConnectionsParameters,
): WatchConnectionsReturnType {
  const { onChange } = parameters
  return config.subscribe((state) => state.connections ?? [], onChange)
}
