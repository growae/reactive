import type {
  Compute,
  GetContractBytecodeErrorType,
  GetContractBytecodeParameters,
  GetContractBytecodeReturnType,
} from '@growae/reactive'
import { getContractBytecode } from '@growae/reactive'
import { computed } from 'vue'
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

  const options = computed(() => ({
    queryKey: [
      'contractBytecode',
      {
        address: parameters.address,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getContractBytecode(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseContractBytecodeReturnType
}
