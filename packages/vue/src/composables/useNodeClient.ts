import type {
  GetNodeClientParameters,
  GetNodeClientReturnType,
  Compute,
} from '@growae/reactive'
import { getNodeClient, watchNodeClient } from '@growae/reactive'
import { onScopeDispose, ref, type Ref } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseNodeClientParameters = Compute<
  GetNodeClientParameters & ConfigParameter
>

export type UseNodeClientReturnType = Ref<GetNodeClientReturnType>

export function useNodeClient(
  parameters: UseNodeClientParameters = {},
): UseNodeClientReturnType {
  const config = useConfig(parameters)
  const client = ref(getNodeClient(config, parameters)) as Ref<GetNodeClientReturnType>

  const unsubscribe = watchNodeClient(config, {
    onChange(value) {
      client.value = value
    },
  })
  onScopeDispose(() => unsubscribe())

  return client
}
