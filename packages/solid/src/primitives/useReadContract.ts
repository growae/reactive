import {
  type ReadContractParameters,
  type ReadContractReturnType,
  readContract,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseReadContractParameters = Accessor<
  ReadContractParameters & {
    config?: import('@reactive/core').Config | undefined
    enabled?: boolean
  }
>

export type UseReadContractReturnType = UseQueryReturnType<
  ReadContractReturnType,
  Error
>

export function useReadContract(
  parameters: UseReadContractParameters = () => ({} as ReadContractParameters),
): UseReadContractReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['readContract', {
      address: parameters().address,
      method: parameters().method,
      args: parameters().args,
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => readContract(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: Boolean(parameters().address && parameters().aci && parameters().method) &&
      (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseReadContractReturnType
}
