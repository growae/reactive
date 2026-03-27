'use client'

import {
  type ReadContractParameters,
  type ReadContractReturnType,
  readContract,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseReadContractParameters = Compute<
  ReadContractParameters & ConfigParameter & { enabled?: boolean }
>

export type UseReadContractReturnType = UseQueryReturnType<
  ReadContractReturnType,
  Error
>

export function useReadContract(
  parameters: UseReadContractParameters = {} as UseReadContractParameters,
): UseReadContractReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'readContract',
      {
        address: parameters.address,
        method: parameters.method,
        args: parameters.args,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      readContract(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled:
      Boolean(parameters.address && parameters.aci && parameters.method) &&
      (parameters.enabled ?? true),
  }) as UseReadContractReturnType
}
