import { type Config, watchConnectors } from '@growae/reactive'
import type { Connector } from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import { useConfig } from './useConfig'

export type UseWatchConnectorsParameters = Accessor<{
  config?: Config | undefined
  onChange: (connectors: readonly Connector[]) => void
  enabled?: boolean
}>

export type UseWatchConnectorsReturnType = void

export function useWatchConnectors(
  parameters: UseWatchConnectorsParameters,
): UseWatchConnectorsReturnType {
  const config = useConfig(parameters)

  createEffect(() => {
    const { enabled = true, onChange } = parameters()
    if (!enabled) return
    if (!onChange) return

    const unwatch = watchConnectors(config(), {
      onChange,
    })
    onCleanup(() => unwatch())
  })
}
