import {
  type GetContractBytecodeErrorType,
  type GetContractBytecodeParameters,
  type GetContractBytecodeReturnType,
  getContractBytecode,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseContractBytecodeParameters = Accessor<
  GetContractBytecodeParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseContractBytecodeReturnType = UseQueryReturnType<
  GetContractBytecodeReturnType,
  GetContractBytecodeErrorType
>

export function useContractBytecode(
  parameters: UseContractBytecodeParameters = () =>
    ({}) as GetContractBytecodeParameters,
): UseContractBytecodeReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'contractBytecode',
      {
        address: parameters().address,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      getContractBytecode(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().address) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseContractBytecodeReturnType
}
