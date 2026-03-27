'use client'

import {
  type GetContractEventsParameters,
  type GetContractEventsReturnType,
  getContractEvents,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseContractEventsParameters = Compute<
  GetContractEventsParameters & ConfigParameter & { enabled?: boolean }
>

export type UseContractEventsReturnType = UseQueryReturnType<
  GetContractEventsReturnType,
  Error
>

export function useContractEvents(
  parameters: UseContractEventsParameters = {} as UseContractEventsParameters,
): UseContractEventsReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'contractEvents',
      {
        address: parameters.address,
        fromHeight: parameters.fromHeight,
        toHeight: parameters.toHeight,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getContractEvents(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }) as UseContractEventsReturnType
}
