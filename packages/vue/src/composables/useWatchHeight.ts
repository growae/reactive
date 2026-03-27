import { watchHeight } from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { type MaybeRef, onScopeDispose, ref, toValue, watch } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseWatchHeightParameters = Compute<
  ConfigParameter & {
    onHeight: (height: number) => void
    enabled?: MaybeRef<boolean>
    interval?: number
    networkId?: string
  }
>

export type UseWatchHeightReturnType = void

export function useWatchHeight(
  parameters: UseWatchHeightParameters,
): UseWatchHeightReturnType {
  const config = useConfig(parameters)
  const configNetworkId = useNetworkId({ config })

  const cleanup = ref<(() => void) | undefined>()

  const stopWatch = watch(
    () => ({
      enabled: toValue(parameters.enabled) ?? true,
      networkId: parameters.networkId ?? configNetworkId.value,
      interval: parameters.interval,
    }),
    (opts) => {
      cleanup.value?.()
      cleanup.value = undefined

      if (!opts.enabled) return

      cleanup.value = watchHeight(config, {
        onChange: (height) => parameters.onHeight(height),
        pollingInterval: opts.interval,
        networkId: opts.networkId,
      })
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    stopWatch()
    cleanup.value?.()
  })
}
