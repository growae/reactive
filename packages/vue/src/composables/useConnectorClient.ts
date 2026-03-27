import type {
  GetConnectorClientParameters,
  GetConnectorClientReturnType,
  Compute,
} from '@growae/reactive'
import { getConnectorClient } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useConnection } from './useConnection.js'
import { useNetworkId } from './useNetworkId.js'

export type UseConnectorClientParameters = Compute<
  GetConnectorClientParameters & ConfigParameter
>

export type UseConnectorClientReturnType = UseQueryReturnType<
  GetConnectorClientReturnType,
  Error
>

export function useConnectorClient(
  parameters: UseConnectorClientParameters = {},
): UseConnectorClientReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })
  const connection = useConnection({ config })

  const options = computed(() => ({
    queryKey: ['connectorClient', {
      networkId: parameters.networkId ?? networkId.value,
      connector: connection.value?.connector?.uid,
    }] as const,
    queryFn: () => getConnectorClient(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
      connector: parameters.connector ?? connection.value?.connector,
    }),
    enabled: !!connection.value?.connector,
  }))

  return useQuery(options) as UseConnectorClientReturnType
}
