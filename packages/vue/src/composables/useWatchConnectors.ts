import { watchConnectors } from '@growae/reactive'
import type { Compute, Connector } from '@growae/reactive'
import { type MaybeRef, onScopeDispose, ref, toValue, watch } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseWatchConnectorsParameters = Compute<
  ConfigParameter & {
    onChange: (connectors: readonly Connector[]) => void
    enabled?: MaybeRef<boolean>
  }
>

export type UseWatchConnectorsReturnType = void

export function useWatchConnectors(
  parameters: UseWatchConnectorsParameters,
): UseWatchConnectorsReturnType {
  const config = useConfig(parameters)

  const cleanup = ref<(() => void) | undefined>()

  const stopWatch = watch(
    () => toValue(parameters.enabled) ?? true,
    (enabled) => {
      cleanup.value?.()
      cleanup.value = undefined

      if (!enabled) return

      cleanup.value = watchConnectors(config, {
        onChange: (connectors) => parameters.onChange(connectors),
      })
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    stopWatch()
    cleanup.value?.()
  })
}
