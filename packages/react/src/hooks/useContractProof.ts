'use client'
import { getContractProof } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseContractProofParameters = NonNullable<
  Parameters<typeof getContractProof>[1]
> &
  QueryParameters
export type UseContractProofReturnType = ReturnType<typeof useContractProof>
export function useContractProof(parameters: UseContractProofParameters) {
  return useActionQuery(
    'getContractProof',
    getContractProof,
    parameters,
    Boolean(parameters.address),
  )
}
