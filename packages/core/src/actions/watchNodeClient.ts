import type { Config } from '../createConfig.js'

export type WatchNodeClientParameters = {
  onChange: (nodeClient: any, prevNodeClient: any) => void
}

export type WatchNodeClientReturnType = () => void

export function watchNodeClient(
  config: Config,
  parameters: WatchNodeClientParameters,
): WatchNodeClientReturnType {
  const { onChange } = parameters

  let currentClient: any = null
  try {
    currentClient = config.getNode({})
  } catch {
    // no node yet
  }

  return config.subscribe(
    (state) => state.networkId,
    (networkId) => {
      try {
        const newClient = config.getNode({ networkId })
        const prev = currentClient
        currentClient = newClient
        onChange(newClient, prev)
      } catch {
        // node not available for this network
      }
    },
  )
}
