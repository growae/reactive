import type {
  GetContractBytecodeParameters,
  GetContractBytecodeReturnType,
  GetContractBytecodeErrorType,
  Compute,
} from '@reactive/core'
import { getContractBytecode } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
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

  const options = computed(() => ({
    queryKey: ['contractBytecode', {
      contractId: parameters.contractId,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => getContractBytecode(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.contractId) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseContractBytecodeReturnType
}
