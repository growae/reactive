import { watchHeight } from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWatchHeightParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
  onHeight: (height: number) => void
  onError?: (error: Error) => void
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
      onError,
    } = parameters()
    if (!enabled) return
    if (!onHeight) return

    const networkId = paramNetworkId ?? configNetworkId()
    const unwatch = watchHeight(config(), {
      onChange: onHeight,
      onError,
      interval,
      networkId,
    })
    onCleanup(() => unwatch())
  })
}
