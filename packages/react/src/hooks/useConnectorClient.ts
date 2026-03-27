'use client'

import {
  type GetConnectionReturnType,
  type GetNodeClientParameters,
  getConnection,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { useQuery } from '../utils/query.js'
import type { UseQueryReturnType } from '../utils/query.js'
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

  return useQuery({
    queryKey: [
      'connectorClient',
      {
        networkId: parameters.networkId ?? networkId,
        connector: connection?.connector?.uid,
      },
    ],
    queryFn: () => getConnection(config),
    enabled: !!connection?.connector,
  }) as UseConnectorClientReturnType
}
