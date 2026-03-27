'use client'

import {
  type GetContractBytecodeErrorType,
  type GetContractBytecodeParameters,
  type GetContractBytecodeReturnType,
  getContractBytecode,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseContractBytecodeParameters = Compute<
  GetContractBytecodeParameters & ConfigParameter & { enabled?: boolean }
>

export type UseContractBytecodeReturnType = UseQueryReturnType<
  GetContractBytecodeReturnType,
  GetContractBytecodeErrorType
>

export function useContractBytecode(
  parameters: UseContractBytecodeParameters = {} as UseContractBytecodeParameters,
): UseContractBytecodeReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'contractBytecode',
      {
        address: parameters.address,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getContractBytecode(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }) as UseContractBytecodeReturnType
}
