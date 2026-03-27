import type { GetConnectionReturnType } from '@growae/reactive'
import { getConnection, watchConnection } from '@growae/reactive'
import { type Ref, onScopeDispose, ref } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'

export type UseConnectionParameters = ConfigParameter

export type UseConnectionReturnType = Ref<GetConnectionReturnType>

export function useConnection(
  parameters: UseConnectionParameters = {},
): UseConnectionReturnType {
  const config = useConfig(parameters)
  const connection = ref(getConnection(config)) as Ref<GetConnectionReturnType>

  const unsubscribe = watchConnection(config, {
    onChange(value) {
      connection.value = value
    },
  })
  onScopeDispose(() => unsubscribe())

  return connection
}
