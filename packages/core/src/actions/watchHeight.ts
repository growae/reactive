import type { Config } from '../createConfig.js'

export type WatchHeightParameters = {
  onChange: (height: number, prevHeight: number) => void
  pollingInterval?: number
  networkId?: string
}

export type WatchHeightReturnType = () => void

export function watchHeight(
  config: Config,
  parameters: WatchHeightParameters,
): WatchHeightReturnType {
  const { onChange, pollingInterval = 10_000, networkId } = parameters

  let currentHeight = 0
  let active = true

  const poll = async () => {
    while (active) {
      try {
        const node = config.getNode({ networkId })
        const status = await node.getStatus()
        const newHeight = status.topBlockHeight ?? 0
        if (newHeight !== currentHeight) {
          const prev = currentHeight
          currentHeight = newHeight
          if (prev > 0) {
            onChange(newHeight, prev)
          }
        }
      } catch {
        // silently retry on next interval
      }
      await new Promise((resolve) => setTimeout(resolve, pollingInterval))
    }
  }

  poll()

  return () => {
    active = false
  }
}
