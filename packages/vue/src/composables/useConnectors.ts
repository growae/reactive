import type { GetConnectorsReturnType } from '@reactive/core'
import { getConnectors, watchConnectors } from '@reactive/core'
import { onScopeDispose, ref, type Ref } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseConnectorsParameters = ConfigParameter

export type UseConnectorsReturnType = Ref<GetConnectorsReturnType>

export function useConnectors(
  parameters: UseConnectorsParameters = {},
): UseConnectorsReturnType {
  const config = useConfig(parameters)
  const connectors = ref(getConnectors(config)) as Ref<GetConnectorsReturnType>

  const unsubscribe = watchConnectors(config, {
    onChange(value) {
      connectors.value = value as GetConnectorsReturnType
    },
  })
  onScopeDispose(() => unsubscribe())

  return connectors
}
