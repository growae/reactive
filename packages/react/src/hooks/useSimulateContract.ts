'use client'

import {
  type SimulateContractParameters,
  type SimulateContractReturnType,
  simulateContract,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseSimulateContractParameters = Compute<
  SimulateContractParameters & ConfigParameter & { enabled?: boolean }
>

export type UseSimulateContractReturnType = UseQueryReturnType<
  SimulateContractReturnType,
  Error
>

export function useSimulateContract(
  parameters: UseSimulateContractParameters = {} as UseSimulateContractParameters,
): UseSimulateContractReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: ['simulateContract', {
      address: parameters.address,
      method: parameters.method,
      args: parameters.args,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => simulateContract(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.address && parameters.aci && parameters.method) &&
      (parameters.enabled ?? true),
  }) as UseSimulateContractReturnType
}
