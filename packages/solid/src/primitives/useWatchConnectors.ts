import { watchConnectors } from '@reactive/core'
import type { Connector } from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseWatchConnectorsParameters = Accessor<{
  config?: import('@reactive/core').Config | undefined
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
