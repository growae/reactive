'use client'

import {
  type GetContractBytecodeParameters,
  type GetContractBytecodeReturnType,
  type GetContractBytecodeErrorType,
  getContractBytecode,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

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
    queryKey: ['contractBytecode', {
      contractId: parameters.contractId,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => getContractBytecode(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.contractId) && (parameters.enabled ?? true),
  }) as UseContractBytecodeReturnType
}
