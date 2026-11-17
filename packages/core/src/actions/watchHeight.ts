import type { Config } from '../createConfig.js'
import { observe } from './observe.js'

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

  let previous: number | undefined
  return observe(
    async () =>
      (await config.getNodeClient({ networkId }).getStatus()).topBlockHeight,
    (height) => {
      const old = previous
      previous = height
      if (old !== undefined && old !== height) onChange(height, old)
    },
    pollingInterval,
  )
}
