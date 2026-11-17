'use client'
import { readContract } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseReadContractParameters = NonNullable<
  Parameters<typeof readContract>[1]
> &
  QueryParameters
export type UseReadContractReturnType = ReturnType<typeof useReadContract>
export function useReadContract(parameters: UseReadContractParameters) {
  return useActionQuery(
    'readContract',
    readContract,
    parameters,
    Boolean(parameters.address && (parameters.function || parameters.callData)),
  )
}
