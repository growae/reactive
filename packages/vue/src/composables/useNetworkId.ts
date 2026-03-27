import type { GetNetworkIdReturnType } from '@reactive/core'
import { getNetworkId, watchNetworkId } from '@reactive/core'
import { onScopeDispose, ref, type Ref } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseNetworkIdParameters = ConfigParameter

export type UseNetworkIdReturnType = Ref<GetNetworkIdReturnType>

export function useNetworkId(
  parameters: UseNetworkIdParameters = {},
): UseNetworkIdReturnType {
  const config = useConfig(parameters)
  const networkId = ref(getNetworkId(config)) as Ref<GetNetworkIdReturnType>

  const unsubscribe = watchNetworkId(config, {
    onChange(value) {
      networkId.value = value
    },
  })
  onScopeDispose(() => unsubscribe())

  return networkId
}
