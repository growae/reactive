'use client'
import { readContracts } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseReadContractsParameters = NonNullable<
  Parameters<typeof readContracts>[1]
> &
  QueryParameters
export type UseReadContractsReturnType = ReturnType<typeof useReadContracts>
export function useReadContracts(parameters: UseReadContractsParameters) {
  return useActionQuery(
    'readContracts',
    readContracts,
    parameters,
    parameters.contracts.length > 0,
  )
}
