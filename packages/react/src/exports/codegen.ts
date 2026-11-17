'use client'
import {
  type CallContractParameters,
  callContract,
  type FateArgument,
} from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import { useConfig } from '../hooks/useConfig.js'
import {
  type UseReadContractParameters,
  useReadContract,
} from '../hooks/useReadContract.js'
import {
  type UseSimulateContractParameters,
  useSimulateContract,
} from '../hooks/useSimulateContract.js'
import {
  type UseWatchContractEventParameters,
  useWatchContractEvent,
} from '../hooks/useWatchContractEvent.js'
import type { ConfigParameter } from '../types/properties.js'

type Bound = { address: string; function: string; networkId?: string }
type BoundRead = Omit<
  UseReadContractParameters,
  'address' | 'function' | 'callData' | 'args'
> & { args?: readonly FateArgument[] }
export function createUseReadContract(bound: Bound) {
  return function useBoundRead(parameters: BoundRead = {}) {
    return useReadContract({
      ...parameters,
      ...bound,
      networkId: bound.networkId ?? parameters.networkId,
    })
  }
}
export function createUseSimulateContract(bound: Bound) {
  return function useBoundSimulation(
    parameters: Omit<
      UseSimulateContractParameters,
      'address' | 'function' | 'callData' | 'args'
    > & { args?: readonly FateArgument[] } = {},
  ) {
    return useSimulateContract({
      ...parameters,
      ...bound,
      networkId: bound.networkId ?? parameters.networkId,
    })
  }
}
export function createUseWriteContract(bound: Bound) {
  return function useBoundWrite(parameters: ConfigParameter = {}) {
    const config = useConfig(parameters)
    const mutation = useMutation({
      retry: false,
      mutationKey: ['writeContract', bound],
      mutationFn: (
        p: Omit<
          CallContractParameters,
          'address' | 'callData' | 'function' | 'args'
        > & { args?: readonly FateArgument[] },
      ) =>
        callContract(config, {
          ...p,
          ...bound,
          networkId: bound.networkId ?? p.networkId,
        }),
    })
    return {
      ...mutation,
      writeContract: mutation.mutate,
      writeContractAsync: mutation.mutateAsync,
    }
  }
}
export function createUseWatchContractEvent(bound: {
  address: string
  event: string
  networkId?: string
}) {
  return function useBoundWatcher(
    parameters: Omit<UseWatchContractEventParameters, 'address' | 'event'>,
  ) {
    return useWatchContractEvent({
      ...parameters,
      ...bound,
      networkId: bound.networkId ?? parameters.networkId,
    })
  }
}
