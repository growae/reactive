import type { Config } from '../createConfig'

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
    currentClient = config.getNodeClient({})
  } catch {
    // no node yet
  }

  return config.subscribe(
    (state) => state.networkId,
    (networkId) => {
      try {
        const newClient = config.getNodeClient({ networkId })
        const prev = currentClient
        currentClient = newClient
        onChange(newClient, prev)
      } catch {
        // node not available for this network
      }
    },
  )
}
