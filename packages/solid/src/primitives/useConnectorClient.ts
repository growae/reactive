import {
  type Config,
  type GetConnectionReturnType,
  type GetNodeClientParameters,
  getConnection,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useConnection } from './useConnection'
import { useNetworkId } from './useNetworkId'

export type UseConnectorClientParameters = Accessor<
  GetNodeClientParameters & {
    config?: Config | undefined
  }
>

export type UseConnectorClientReturnType = UseQueryReturnType<
  GetConnectionReturnType,
  Error
>

export function useConnectorClient(
  parameters: UseConnectorClientParameters = () => ({}),
): UseConnectorClientReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))
  const connection = useConnection(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'connectorClient',
      {
        networkId: parameters().networkId ?? networkId(),
        connector: connection()?.connector?.uid,
      },
    ] as const,
    queryFn: () => getConnection(config()),
    enabled: !!connection()?.connector,
  }))

  return useQuery(options) as UseConnectorClientReturnType
}
