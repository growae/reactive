import {
  type SimulateContractParameters,
  type SimulateContractReturnType,
  simulateContract,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseSimulateContractParameters = Accessor<
  SimulateContractParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseSimulateContractReturnType = UseQueryReturnType<
  SimulateContractReturnType,
  Error
>

export function useSimulateContract(
  parameters: UseSimulateContractParameters = () =>
    ({}) as SimulateContractParameters,
): UseSimulateContractReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'simulateContract',
      {
        address: parameters().address,
        method: parameters().method,
        args: parameters().args,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      simulateContract(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled:
      Boolean(
        parameters().address && parameters().aci && parameters().method,
      ) &&
      (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseSimulateContractReturnType
}
