import type {
  Compute,
  GetConnectionReturnType,
  GetNodeClientParameters,
} from '@growae/reactive'
import { getConnection } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useConnection } from './useConnection.js'
import { useNetworkId } from './useNetworkId.js'

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
