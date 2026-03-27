'use client'

import {
  type GetConnectorClientParameters,
  type GetConnectorClientReturnType,
  getConnectorClient,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { useQuery } from '../utils/query.js'
import type { UseQueryReturnType } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
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

  return useQuery({
    queryKey: ['connectorClient', {
      networkId: parameters.networkId ?? networkId,
      connector: connection?.connector?.uid,
    }],
    queryFn: () => getConnectorClient(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
      connector: parameters.connector ?? connection?.connector,
    }),
    enabled: !!connection?.connector,
  }) as UseConnectorClientReturnType
}
