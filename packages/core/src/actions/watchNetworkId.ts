import type { Config } from '../createConfig.js'

export type WatchNetworkIdParameters = {
  onChange: (networkId: string, prevNetworkId: string) => void
}

export type WatchNetworkIdReturnType = () => void

export function watchNetworkId(
  config: Config,
  parameters: WatchNetworkIdParameters,
): WatchNetworkIdReturnType {
  const { onChange } = parameters
  return config.subscribe(
    (state) => state.networkId,
    onChange,
  )
}
