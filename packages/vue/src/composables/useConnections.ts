import type { GetConnectionsReturnType } from '@reactive/core'
import { getConnections, watchConnections } from '@reactive/core'
import { onScopeDispose, ref, type Ref } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseConnectionsParameters = ConfigParameter

export type UseConnectionsReturnType = Ref<GetConnectionsReturnType>

export function useConnections(
  parameters: UseConnectionsParameters = {},
): UseConnectionsReturnType {
  const config = useConfig(parameters)
  const connections = ref(getConnections(config)) as Ref<GetConnectionsReturnType>

  const unsubscribe = watchConnections(config, {
    onChange(value) {
      connections.value = value
    },
  })
  onScopeDispose(() => unsubscribe())

  return connections
}
