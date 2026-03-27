import {
  type GetConnectorClientParameters,
  type GetConnectorClientReturnType,
  getConnectorClient,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useConnection } from './useConnection.js'
import { useNetworkId } from './useNetworkId.js'

export type UseConnectorClientParameters = Accessor<
  GetConnectorClientParameters & { config?: import('@growae/reactive').Config | undefined }
>

export type UseConnectorClientReturnType = UseQueryReturnType<
  GetConnectorClientReturnType,
  Error
>

export function useConnectorClient(
  parameters: UseConnectorClientParameters = () => ({}),
): UseConnectorClientReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))
  const connection = useConnection(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['connectorClient', {
      networkId: parameters().networkId ?? networkId(),
      connector: connection()?.connector?.uid,
    }] as const,
    queryFn: () => getConnectorClient(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
      connector: parameters().connector ?? connection()?.connector,
    }),
    enabled: !!connection()?.connector,
  }))

  return useQuery(options) as UseConnectorClientReturnType
}
