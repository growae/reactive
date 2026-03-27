import {
  type GetContractEventsParameters,
  type GetContractEventsReturnType,
  getContractEvents,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseContractEventsParameters = Accessor<
  GetContractEventsParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseContractEventsReturnType = UseQueryReturnType<
  GetContractEventsReturnType,
  Error
>

export function useContractEvents(
  parameters: UseContractEventsParameters = () =>
    ({}) as GetContractEventsParameters,
): UseContractEventsReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'contractEvents',
      {
        address: parameters().address,
        fromHeight: parameters().fromHeight,
        toHeight: parameters().toHeight,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      getContractEvents(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().address) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseContractEventsReturnType
}
