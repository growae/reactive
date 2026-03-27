import { watchConnection } from '@growae/reactive'
import type { Connection } from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseWatchConnectionParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
  onChange: (connection: Connection | undefined) => void
  enabled?: boolean
}>

export type UseWatchConnectionReturnType = void

export function useWatchConnection(
  parameters: UseWatchConnectionParameters,
): UseWatchConnectionReturnType {
  const config = useConfig(parameters)

  createEffect(() => {
    const { enabled = true, onChange } = parameters()
    if (!enabled) return
    if (!onChange) return

    const unwatch = watchConnection(config(), {
      onChange,
    })
    onCleanup(() => unwatch())
  })
}
