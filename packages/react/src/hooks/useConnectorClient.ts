'use client'

import {
  type GetConnectionReturnType,
  type GetNodeClientParameters,
  getConnection,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { useQuery } from '../utils/query'
import type { UseQueryReturnType } from '../utils/query'
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
