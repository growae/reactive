import type { Config } from '../createConfig.js'

export type WatchConnectorsParameters = {
  onChange: (connectors: any[], prevConnectors: any[]) => void
}

export type WatchConnectorsReturnType = () => void

export function watchConnectors(
  config: Config,
  parameters: WatchConnectorsParameters,
): WatchConnectorsReturnType {
  const { onChange } = parameters
  return config.subscribe((state) => state.connectors ?? [], onChange)
}
