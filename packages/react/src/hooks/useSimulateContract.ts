'use client'
import { simulateContract } from '@growae/reactive'
import type { UseQueryReturnType } from '../utils/query.js'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseSimulateContractParameters = NonNullable<
  Parameters<typeof simulateContract>[1]
> &
  QueryParameters
export type UseSimulateContractReturnType = UseQueryReturnType<
  Awaited<ReturnType<typeof simulateContract>>,
  Error
>
export function useSimulateContract(
  parameters: UseSimulateContractParameters,
): UseSimulateContractReturnType {
  return useActionQuery(
    'simulateContract',
    simulateContract,
    parameters,
    Boolean(parameters.address && (parameters.function || parameters.callData)),
  )
}
