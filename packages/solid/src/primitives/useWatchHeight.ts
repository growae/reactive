import { type Config, watchHeight } from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseWatchHeightParameters = Accessor<{
  config?: Config | undefined
  onHeight: (height: number) => void
  enabled?: boolean
  interval?: number
  networkId?: string
}>

export type UseWatchHeightReturnType = void

export function useWatchHeight(
  parameters: UseWatchHeightParameters,
): UseWatchHeightReturnType {
  const config = useConfig(parameters)
  const configNetworkId = useNetworkId(() => ({ config: config() }))

  createEffect(() => {
    const {
      enabled = true,
      interval,
      networkId: paramNetworkId,
      onHeight,
    } = parameters()
    if (!enabled) return
    if (!onHeight) return

    const networkId = paramNetworkId ?? configNetworkId()
    const unwatch = watchHeight(config(), {
      onChange: onHeight,
      pollingInterval: interval,
      networkId,
    })
    onCleanup(() => unwatch())
  })
}
