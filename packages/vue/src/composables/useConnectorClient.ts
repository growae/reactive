import type {
  Compute,
  GetConnectionReturnType,
  GetNodeClientParameters,
} from '@growae/reactive'
import { getConnection } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useConnection } from './useConnection'
import { useNetworkId } from './useNetworkId'

export type UseConnectorClientParameters = Compute<
  GetNodeClientParameters & ConfigParameter
>

export type UseConnectorClientReturnType = UseQueryReturnType<
  GetConnectionReturnType,
  Error
>

export function useConnectorClient(
  parameters: UseConnectorClientParameters = {},
): UseConnectorClientReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })
  const connection = useConnection({ config })

  const options = computed(() => ({
    queryKey: [
      'connectorClient',
      {
        networkId: parameters.networkId ?? networkId.value,
        connector: connection.value?.connector?.uid,
      },
    ] as const,
    queryFn: () => getConnection(config),
    enabled: !!connection.value?.connector,
  }))

  return useQuery(options) as UseConnectorClientReturnType
}
