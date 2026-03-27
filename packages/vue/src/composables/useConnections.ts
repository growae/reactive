import type { GetConnectionsReturnType } from '@growae/reactive'
import { getConnections, watchConnections } from '@growae/reactive'
import { type Ref, onScopeDispose, ref } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'

export type UseConnectionsParameters = ConfigParameter

export type UseConnectionsReturnType = Ref<GetConnectionsReturnType>

export function useConnections(
  parameters: UseConnectionsParameters = {},
): UseConnectionsReturnType {
  const config = useConfig(parameters)
  const connections = ref(
    getConnections(config),
  ) as Ref<GetConnectionsReturnType>

  const unsubscribe = watchConnections(config, {
    onChange(value) {
      connections.value = value
    },
  })
  onScopeDispose(() => unsubscribe())

  return connections
}
