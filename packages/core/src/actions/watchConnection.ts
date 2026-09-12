import type { Config } from '../createConfig.js'

export type WatchConnectionParameters = {
  onChange: (connection: any, prevConnection: any) => void
}

export type WatchConnectionReturnType = () => void

export function watchConnection(
  config: Config,
  parameters: WatchConnectionParameters,
): WatchConnectionReturnType {
  const { onChange } = parameters
  return config.subscribe((state) => state.current, onChange)
}
