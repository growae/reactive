import { watchConnection } from '@reactive/core'
import type { Connection } from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseWatchConnectionParameters = Accessor<{
  config?: import('@reactive/core').Config | undefined
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
