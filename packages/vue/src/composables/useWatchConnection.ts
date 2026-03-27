import { watchConnection } from '@reactive/core'
import type { Connection, Compute } from '@reactive/core'
import { onScopeDispose, watch, ref, toValue, type MaybeRef } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseWatchConnectionParameters = Compute<
  ConfigParameter & {
    onChange: (connection: Connection | undefined) => void
    enabled?: MaybeRef<boolean>
  }
>

export type UseWatchConnectionReturnType = void

export function useWatchConnection(
  parameters: UseWatchConnectionParameters,
): UseWatchConnectionReturnType {
  const config = useConfig(parameters)

  const cleanup = ref<(() => void) | undefined>()

  const stopWatch = watch(
    () => toValue(parameters.enabled) ?? true,
    (enabled) => {
      cleanup.value?.()
      cleanup.value = undefined

      if (!enabled) return

      cleanup.value = watchConnection(config, {
        onChange: (connection) => parameters.onChange(connection),
      })
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    stopWatch()
    cleanup.value?.()
  })
}
